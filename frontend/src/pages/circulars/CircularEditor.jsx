import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import * as circularsApi from '@/api/circulars.api';
import Alert from '@/components/common/Alert';
import Spinner from '@/components/common/Spinner';

const AUDIENCES = ['All', 'Residents', 'Committee'];

function ToolbarButton({ onClick, active, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm font-medium border transition-colors ${
        active ? 'bg-brand text-white border-brand' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function CircularEditor() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All');
  const [docFile, setDocFile] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const editor = useEditor({
    extensions: [StarterKit, Underline, Heading.configure({ levels: [1, 2, 3] })],
    content: '',
  });

  // Load existing circular for edit
  useEffect(() => {
    if (!id || !editor) return;
    circularsApi.getCircular(id).then(({ data }) => {
      setTitle(data.circular.title);
      setAudience(data.circular.audience);
      editor.commands.setContent(data.circular.content || '');
    }).catch(() => navigate('/circulars')).finally(() => setLoading(false));
  }, [id, editor, navigate]);

  const handleSubmit = async (e, publishAfter = false) => {
    e.preventDefault();
    const content = editor?.getHTML() || '';
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!docFile && (!content || content === '<p></p>')) { setError('Content is required (or upload a Word document).'); return; }

    setSaving(true);
    setError('');
    try {
      let circularId = id;

      if (docFile) {
        // Upload with FormData (Word doc → server parses it)
        const fd = new FormData();
        fd.append('title', title);
        fd.append('audience', audience);
        fd.append('document', docFile);
        const { data } = await circularsApi.createCircular(fd);
        circularId = data.circular._id;
      } else if (!id) {
        const { data } = await circularsApi.createCircular({ title, audience, content });
        circularId = data.circular._id;
      } else {
        await circularsApi.updateCircular(id, { title, audience, content });
      }

      if (publishAfter) {
        await circularsApi.publishCircular(circularId);
        navigate('/circulars');
      } else {
        navigate(`/circulars/${circularId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner size="lg" className="mt-20" />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/circulars" className="text-sm text-brand hover:underline">← Circulars</Link>
      </div>
      <h1 className="page-title">{id ? 'Edit Circular' : 'New Circular'}</h1>

      <Alert type="error" message={error} onClose={() => setError('')} />

      <form onSubmit={(e) => handleSubmit(e, false)} className="card space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Circular title…" />
        </div>

        <div>
          <label className="label">Audience</label>
          <select className="input" value={audience} onChange={(e) => setAudience(e.target.value)}>
            {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>

        {/* Word doc upload option */}
        {!id && (
          <div>
            <label className="label">Upload Word Document (optional — replaces editor)</label>
            <input
              type="file"
              accept=".docx,.doc"
              className="input"
              onChange={(e) => setDocFile(e.target.files[0] || null)}
            />
            <p className="text-xs text-gray-400 mt-1">
              If you upload a .docx file, its content will be parsed and used directly. The editor below will be ignored.
            </p>
          </div>
        )}

        {/* Rich text editor */}
        {!docFile && (
          <div>
            <label className="label">Content</label>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border border-gray-300 rounded-t-md bg-gray-50">
              <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold"><b>B</b></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic"><i>I</i></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline"><u>U</u></ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading">H2</ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Sub-heading">H3</ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet list">• List</ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered list">1. List</ToolbarButton>
            </div>
            <div className="border border-t-0 border-gray-300 rounded-b-md min-h-[220px] bg-white">
              <EditorContent editor={editor} />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-secondary flex-1">
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={(e) => handleSubmit(e, true)}
            className="btn-primary flex-1"
          >
            {saving ? 'Publishing…' : 'Save & Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
