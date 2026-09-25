export default function Brand({ light = false }) {
  return <span className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark">N<span>.</span></span><span className="brand-word">NoteTag</span></span>;
}
