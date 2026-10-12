import React from "react";
import { BookOpen, CheckCircle2, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { CAMPUS_DATA } from "../data/mockData";

export default function CourseSection({ onEnroll }) {
  const { course } = CAMPUS_DATA;
  return <section className="mx-auto max-w-7xl px-6 pb-24 pt-32 sm:px-12">
    <div className="grid gap-10 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-[.9fr_1.1fr]">
      <div className="min-h-[300px] bg-slate-100"><img src={course.heroImage} alt="校园书单" className="h-full w-full object-cover" /></div>
      <div className="p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">专业书单与平台指南</p><h1 className="mt-3 text-4xl font-black">{course.title}</h1><p className="mt-5 leading-7 text-slate-500">{course.subtitle}</p><div className="mt-8 rounded-2xl bg-blue-50 p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Sparkles size={18} /></div><div><p className="font-bold text-blue-950">{course.instructor.name}</p><p className="text-xs text-blue-700">{course.instructor.role}</p></div></div><p className="mt-4 text-sm leading-6 text-blue-900/70">{course.instructor.bio}</p></div><button onClick={onEnroll} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"><BookOpen size={17} /> 提交专业书单建议</button></div>
    </div>
    <div className="mt-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">使用流程</p><h2 className="mt-2 text-3xl font-black">从发现到交接，四步完成</h2><div className="mt-7 grid gap-4 md:grid-cols-4">{[["01", "选择校区和分类", "按金明、明伦校区以及书籍、数码、宿舍生活等分类浏览。", MapPin], ["02", "查看商品和卖家", "确认成色、价格、交接点和卖家信用信息。", CheckCircle2], ["03", "站内沟通细节", "确认时间、地点和交易方式，保留平台沟通记录。", MessageCircle], ["04", "当面验货完成交接", "在校园公共区域交接，双方确认后结束交易。", BookOpen]].map(([number, title, desc, Icon]) => <div key={number} className="rounded-3xl border border-slate-200 bg-white p-6"><span className="font-mono text-sm font-bold text-emerald-600">/{number}</span><div className="mt-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Icon size={18} /></div><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p></div>)}</div></div>
  </section>;
}
