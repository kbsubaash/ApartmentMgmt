const prisma = require('../config/prisma');

const fmt = (c) => c ? { ...c, _id: c.id } : null;

const getContacts = async (req, res, next) => {
  try {
    const where = {};
    // Non-admin sees only active contacts
    if (!['Admin', 'Committee'].includes(req.user.role)) {
      where.isActive = true;
    }
    const contacts = await prisma.communityContact.findMany({
      where,
      orderBy: [{ order: 'asc' }, { category: 'asc' }],
    });
    res.json({ contacts: contacts.map(fmt) });
  } catch (err) {
    next(err);
  }
};

const createContact = async (req, res, next) => {
  try {
    const { category, name, phone, phone2, address, notes, icon, order, isActive } = req.body;
    const contact = await prisma.communityContact.create({
      data: { category, name, phone: phone || null, phone2: phone2 || null, address: address || null, notes: notes || null, icon: icon || null, order: order ?? 0, isActive: isActive ?? true },
    });
    res.status(201).json({ contact: fmt(contact) });
  } catch (err) {
    next(err);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, name, phone, phone2, address, notes, icon, order, isActive } = req.body;
    const existing = await prisma.communityContact.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Contact not found' });

    const data = {};
    if (category !== undefined) data.category = category;
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone || null;
    if (phone2 !== undefined) data.phone2 = phone2 || null;
    if (address !== undefined) data.address = address || null;
    if (notes !== undefined) data.notes = notes || null;
    if (icon !== undefined) data.icon = icon || null;
    if (order !== undefined) data.order = Number(order);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const contact = await prisma.communityContact.update({ where: { id }, data });
    res.json({ contact: fmt(contact) });
  } catch (err) {
    next(err);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.communityContact.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Contact not found' });
    await prisma.communityContact.delete({ where: { id } });
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getContacts, createContact, updateContact, deleteContact };
