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
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-32 sm:px-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">校园私信</p>
          <h1 className="mt-2 text-4xl font-black text-slate-950">站内沟通</h1>
          <p className="mt-3 text-sm text-slate-500">围绕商品或跑腿任务与同学沟通，消息会保存在后端。</p>
        </div>
        <button onClick={loadConversations} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={15} /> 刷新</button>
      </div>
      {error && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}
      <div className="grid min-h-[520px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 p-5 font-bold">我的会话</div>
          {loading ? <p className="p-5 text-sm text-slate-400">加载中…</p> : conversations.length === 0 ? <div className="p-8 text-center text-sm text-slate-400"><MessageCircle className="mx-auto mb-3" size={28} />还没有会话<br /><span className="text-xs">在商品详情点击“联系卖家”即可发起</span></div> : conversations.map((conversation) => <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${selected?.id === conversation.id ? "bg-emerald-50" : ""}`}><p className="font-bold text-slate-800">{conversation.target_title || "校园沟通"}</p><p className="mt-1 truncate text-xs text-slate-500">{conversation.last_message?.content || "暂无消息"}</p>{conversation.unread_count > 0 && <span className="mt-2 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">{conversation.unread_count} 条未读</span>}</button>)}
        </aside>
        <div className="flex min-h-[520px] flex-col bg-slate-50/70">
          {selected ? <>
            <header className="border-b border-slate-200 bg-white p-5"><p className="text-xs font-bold text-emerald-600">{selected.target_type === "product" ? "商品会话" : "跑腿会话"}</p><h2 className="mt-1 font-bold text-slate-900">{selected.target_title || "校园沟通"}</h2></header>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.length === 0 ? <p className="py-16 text-center text-sm text-slate-400">还没有消息，先打个招呼吧。</p> : messages.map((message) => <div key={message.id} className={`flex ${message.is_mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.is_mine ? "rounded-br-sm bg-slate-950 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"}`}>{message.content}</div></div>)}</div>
            <form onSubmit={handleSubmit} className="flex gap-3 border-t border-slate-200 bg-white p-4"><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} placeholder="输入消息…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500" /><button className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"><Send size={15} /> 发送</button></form>
          </> : <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-400"><div><MessageCircle className="mx-auto mb-3" size={38} /><p>选择一个会话开始沟通</p></div></div>}
        </div>
      </div>
    </section>
  );
}
