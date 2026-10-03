import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { Bold, Italic, Link2, List, ListOrdered, Quote, Underline } from 'lucide-react';

const BUTTONS = [
  { key: 'bold', icon: Bold, label: 'Bold', run: (c) => c.toggleBold() },
  { key: 'italic', icon: Italic, label: 'Italic', run: (c) => c.toggleItalic() },
  { key: 'underline', icon: Underline, label: 'Underline', run: (c) => c.toggleUnderline() },
  { key: 'bulletList', icon: List, label: 'Bulleted list', run: (c) => c.toggleBulletList() },
  { key: 'orderedList', icon: ListOrdered, label: 'Numbered list', run: (c) => c.toggleOrderedList() },
  { key: 'blockquote', icon: Quote, label: 'Quote', run: (c) => c.toggleBlockquote() },
];

function Toolbar({ editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      Object.fromEntries([...BUTTONS.map((b) => b.key), 'link'].map((k) => [k, e.isActive(k)])),
  });

  const toggleLink = () => {
    if (active.link) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const url = window.prompt('Link address', 'https://');
    if (!url || url === 'https://') return;
    const href = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="format-bar" role="toolbar" aria-label="Text formatting">
      {BUTTONS.map(({ key, icon: Icon, label, run }) => (
        <button
          type="button"
          key={key}
          className={`format-btn${active[key] ? ' is-active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run(editor.chain().focus()).run()}
          aria-label={label}
          aria-pressed={active[key]}
          title={label}
        >
          <Icon size={18} />
        </button>
      ))}
      <button
        type="button"
        className={`format-btn${active.link ? ' is-active' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggleLink}
        aria-label={active.link ? 'Remove link' : 'Add link'}
        aria-pressed={active.link}
        title={active.link ? 'Remove link' : 'Add link'}
      >
        <Link2 size={18} />
      </button>
    </div>
  );
}

/**
 * Formatted writing area. Reports (html, plainText) on every change; the schema
 * only allows paragraphs, bold/italic/underline/strike, lists, quotes and links.
 */
export default function RichEditor({ initialHtml, onChange, autoFocus }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Placeholder.configure({ placeholder: 'Dear diary…' }),
    ],
    content: initialHtml,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: { class: 'rich-content', 'aria-label': 'Entry content', role: 'textbox', 'aria-multiline': 'true' },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML(), e.getText({ blockSeparator: '\n' })),
  });

  if (!editor) return null;
  return (
    <>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
}
