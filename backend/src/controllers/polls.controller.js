const prisma = require('../config/prisma');
const { createNotificationsForAudience } = require('../services/notification.service');
const { createAuditLog } = require('../services/audit.service');

const userSelect = { select: { id: true, name: true, role: true } };

const fmtPoll = (poll, userId = null) => {
  const totalVotes = poll.votes?.length || 0;

  const options = (poll.options || [])
    .sort((a, b) => a.order - b.order)
    .map((opt) => {
      const voteCount = poll.votes?.filter((v) => v.optionId === opt.id).length || 0;
      return {
        ...opt,
        _id: opt.id,
        voteCount,
        percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
      };
    });

  const userVote = userId
    ? poll.votes?.find((v) => v.userId === userId) || null
    : null;

  return {
    ...poll,
    _id: poll.id,
    createdBy: poll.createdBy ? { ...poll.createdBy, _id: poll.createdBy.id } : null,
    options,
    totalVotes,
    userVote: userVote ? { optionId: userVote.optionId, votedAt: userVote.votedAt } : null,
    hasVoted: !!userVote,
  };
};

const pollInclude = {
  include: {
    createdBy: userSelect,
    options: true,
    votes: true,
  },
};

// GET /api/polls
const getPolls = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (req.user.role === 'Resident') {
      where.status = 'Active';
      where.audience = { in: ['All', 'Residents'] };
    } else {
      if (status) where.status = status;
    }

    const [rows, total] = await Promise.all([
      prisma.poll.findMany({
        where,
        ...pollInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.poll.count({ where }),
    ]);

    res.json({ polls: rows.map((p) => fmtPoll(p, req.user.id)), total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/polls/:id
const getPoll = async (req, res, next) => {
  try {
    const poll = await prisma.poll.findUnique({ where: { id: req.params.id }, ...pollInclude });
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    if (req.user.role === 'Resident' && poll.status !== 'Active') {
      return res.status(403).json({ message: 'Poll is not active' });
    }

    res.json({ poll: fmtPoll(poll, req.user.id) });
  } catch (err) {
    next(err);
  }
};

// POST /api/polls — Admin/Committee
const createPoll = async (req, res, next) => {
  try {
    const { title, description, audience, endDate, options = [] } = req.body;

    if (!options || options.length < 2) {
      return res.status(422).json({ message: 'At least 2 options are required' });
    }

    const poll = await prisma.poll.create({
      data: {
        title,
        description: description || null,
        audience: audience || 'All',
        endDate: endDate ? new Date(endDate) : null,
        createdById: req.user.id,
        options: {
          create: options.map((text, idx) => ({ text: String(text).trim(), order: idx })),
        },
      },
      ...pollInclude,
    });

    await createAuditLog({
      action: 'CREATE_POLL', entity: 'Poll', entityId: poll.id,
      performedBy: req.user.id, newValue: { title, audience }, ipAddress: req.ip,
    });

    res.status(201).json({ poll: fmtPoll(poll, req.user.id) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/polls/:id — Admin/Committee, Draft only
const updatePoll = async (req, res, next) => {
  try {
    const existing = await prisma.poll.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Poll not found' });
    if (existing.status !== 'Draft') {
      return res.status(400).json({ message: 'Only Draft polls can be edited' });
    }

    const { title, description, audience, endDate, options } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (audience !== undefined) data.audience = audience;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

    await prisma.poll.update({ where: { id: req.params.id }, data });

    // Replace options if provided
    if (options && Array.isArray(options) && options.length >= 2) {
      await prisma.pollOption.deleteMany({ where: { pollId: req.params.id } });
      await prisma.pollOption.createMany({
        data: options.map((text, idx) => ({
          pollId: req.params.id,
          text: String(text).trim(),
          order: idx,
        })),
      });
    }

    const poll = await prisma.poll.findUnique({ where: { id: req.params.id }, ...pollInclude });
    res.json({ poll: fmtPoll(poll, req.user.id) });
  } catch (err) {
    next(err);
  }
};

// POST /api/polls/:id/publish — activate voting
const publishPoll = async (req, res, next) => {
  try {
    const existing = await prisma.poll.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Poll not found' });
    if (existing.status !== 'Draft') return res.status(400).json({ message: 'Poll is already active or closed' });

    await prisma.poll.update({ where: { id: req.params.id }, data: { status: 'Active' } });

    // Notify target users
    const roleWhere = { status: 'active' };
    if (existing.audience === 'Residents') roleWhere.role = 'Resident';
    else if (existing.audience === 'Committee') roleWhere.role = { in: ['Committee', 'Admin'] };

    const users = await prisma.user.findMany({ where: roleWhere, select: { id: true, email: true, name: true } });
    await createNotificationsForAudience({
      users,
      type: 'GENERAL',
      message: `New poll: "${existing.title}" — your vote is needed`,
      relatedEntity: 'Circular',
      relatedId: existing.id,
    });

    await createAuditLog({
      action: 'PUBLISH_POLL', entity: 'Poll', entityId: existing.id,
      performedBy: req.user.id, newValue: { status: 'Active' }, ipAddress: req.ip,
    });

    const poll = await prisma.poll.findUnique({ where: { id: req.params.id }, ...pollInclude });
    res.json({ message: 'Poll is now active', poll: fmtPoll(poll, req.user.id) });
  } catch (err) {
    next(err);
  }
};

// POST /api/polls/:id/close
const closePoll = async (req, res, next) => {
  try {
    const existing = await prisma.poll.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Poll not found' });
    if (existing.status !== 'Active') return res.status(400).json({ message: 'Poll is not active' });

    await prisma.poll.update({ where: { id: req.params.id }, data: { status: 'Closed' } });

    await createAuditLog({
      action: 'CLOSE_POLL', entity: 'Poll', entityId: existing.id,
      performedBy: req.user.id, newValue: { status: 'Closed' }, ipAddress: req.ip,
    });

    const poll = await prisma.poll.findUnique({ where: { id: req.params.id }, ...pollInclude });
    res.json({ message: 'Poll closed', poll: fmtPoll(poll, req.user.id) });
  } catch (err) {
    next(err);
  }
};

// POST /api/polls/:id/vote
const castVote = async (req, res, next) => {
  try {
    const { optionId } = req.body;
    const pollId = req.params.id;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.status !== 'Active') return res.status(400).json({ message: 'Voting is not open for this poll' });
    if (poll.endDate && new Date() > poll.endDate) {
      return res.status(400).json({ message: 'Voting deadline has passed' });
    }

    const validOption = poll.options.find((o) => o.id === optionId);
    if (!validOption) return res.status(422).json({ message: 'Invalid option' });

    // Check if already voted
    const existing = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId: req.user.id } },
    });
    if (existing) return res.status(409).json({ message: 'You have already voted on this poll' });

    await prisma.pollVote.create({
      data: { pollId, optionId, userId: req.user.id },
    });

    const updated = await prisma.poll.findUnique({ where: { id: pollId }, ...pollInclude });
    res.json({ message: 'Vote cast successfully', poll: fmtPoll(updated, req.user.id) });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/polls/:id — Admin only, Draft only
const deletePoll = async (req, res, next) => {
  try {
    const existing = await prisma.poll.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Poll not found' });
    if (existing.status !== 'Draft') return res.status(400).json({ message: 'Only Draft polls can be deleted' });

    await prisma.poll.delete({ where: { id: req.params.id } });

    await createAuditLog({
      action: 'DELETE_POLL', entity: 'Poll', entityId: req.params.id,
      performedBy: req.user.id, ipAddress: req.ip,
    });

    res.json({ message: 'Poll deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPolls, getPoll, createPoll, updatePoll, publishPoll, closePoll, castVote, deletePoll };
