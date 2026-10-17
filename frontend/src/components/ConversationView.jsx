import { useEffect, useMemo, useState } from "react";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
import {
  fetchConversations,
  fetchConversationMessages,
  markConversationRead,
  sendConversationMessage,
} from "../services/api";

export default function ConversationView({ initialConversationId = null }) {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || conversations[0],
    [conversations, selectedId],
  );

  async function loadConversations() {
    setLoading(true);
    const result = await fetchConversations();
    if (result.success) {
      setConversations(result.conversations);
      if (!selectedId && result.conversations[0]) setSelectedId(result.conversations[0].id);
      setError("");
    } else {
      setError(result.error || "暂时无法加载私信");
    }
    setLoading(false);
  }

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return;
    }
    let active = true;
    (async () => {
      const result = await fetchConversationMessages(selected.id);
      if (!active) return;
      if (result.success) {
        setMessages(result.messages);
        await markConversationRead(selected.id);
      } else setError(result.error || "暂时无法加载消息");
    })();
    return () => { active = false; };
  }, [selected?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selected?.id) return;
    const result = await sendConversationMessage(selected.id, content);
    if (!result.success) {
      setError(result.error || "消息发送失败");
      return;
    }
    setMessages((current) => [...current, result.message]);
    setDraft("");
    await loadConversations();
  }

  return (
    <section className="reveal mx-auto max-w-7xl px-4 pb-20 pt-28 sm:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[var(--meta)]">校园私信</p>
          <h1 className="mt-3 display-2 text-[var(--fg)]">站内沟通</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">围绕商品或跑腿任务与同学沟通，消息会保存在后端。</p>
        </div>
        <button onClick={loadConversations} className="press inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--fg-2)] transition-colors hover:bg-[var(--surface)]"><RefreshCw size={15} /> 刷新</button>
      </div>
      {error && <div role="alert" className="mb-5 rounded-panel border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}
      <div className="grid min-h-[520px] overflow-hidden rounded-panel border border-[var(--border-soft)] bg-[var(--bg)] shadow-card lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-[var(--border-soft)] lg:border-b-0 lg:border-r">
          <div className="glass-light p-5 font-bold text-[var(--fg)]">我的会话</div>
          {loading ? <p className="p-5 text-sm text-[var(--meta)]">加载中…</p> : conversations.length === 0 ? <div className="p-8 text-center text-sm text-[var(--meta)]"><MessageCircle className="mx-auto mb-3" size={28} />还没有会话<br /><span className="text-xs">在商品详情点击“联系卖家”即可发起</span></div> : conversations.map((conversation) => <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`w-full border-b border-[var(--border-soft)] p-4 text-left transition-colors hover:bg-[var(--surface)] ${selected?.id === conversation.id ? "bg-[var(--surface)]" : ""}`}><p className="font-bold text-[var(--fg)]">{conversation.target_title || "校园沟通"}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{conversation.last_message?.content || "暂无消息"}</p>{conversation.unread_count > 0 && <span className="mt-2 inline-block rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-bold text-white tnum">{conversation.unread_count} 条未读</span>}</button>)}
        </aside>
        <div className="flex min-h-[520px] flex-col bg-[var(--surface)]">
          {selected ? <>
            <header className="glass-light p-5"><p className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">{selected.target_type === "product" ? "商品会话" : "跑腿会话"}</p><h2 className="mt-1 font-bold text-[var(--fg)]">{selected.target_title || "校园沟通"}</h2></header>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.length === 0 ? <p className="py-16 text-center text-sm text-[var(--meta)]">还没有消息，先打个招呼吧。</p> : messages.map((message) => <div key={message.id} className={`flex ${message.is_mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.is_mine ? "rounded-br-sm bg-ink-950 text-white" : "rounded-bl-sm border border-[var(--border-soft)] bg-[var(--bg)] text-[var(--fg)]"}`}>{message.content}</div></div>)}</div>
            <form onSubmit={handleSubmit} className="glass-light flex gap-3 p-4"><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} placeholder="输入消息…" className="min-w-0 flex-1 rounded-field border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:bg-[var(--bg)]" /><button className="press inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)]"><Send size={15} /> 发送</button></form>
          </> : <div className="flex flex-1 items-center justify-center p-8 text-center text-[var(--meta)]"><div><MessageCircle className="mx-auto mb-3" size={38} /><p>选择一个会话开始沟通</p></div></div>}
        </div>
      </div>
    </section>
  );
}
