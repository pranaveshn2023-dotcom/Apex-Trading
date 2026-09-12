import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap, Building2, Rocket, LineChart, Shield, Brain, BookOpen,
  CheckCircle2, Clock, ChevronLeft, ChevronRight, ArrowRight, Lightbulb,
  Search, Award
} from 'lucide-react';
import { LEARN_MODULES, GLOSSARY } from '../data/learnContent';

const MODULE_ICONS = {
  building: Building2,
  rocket: Rocket,
  chart: LineChart,
  shield: Shield,
  brain: Brain,
};

const PROGRESS_KEY = 'bt-learn-progress-v1';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || [];
  } catch {
    return [];
  }
}

export default function LearnAcademy({ onNavigate }) {
  const [progress, setProgress] = useState(loadProgress);
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [view, setView] = useState('lessons'); // 'lessons' | 'glossary'
  const [glossaryQuery, setGlossaryQuery] = useState('');

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const allLessons = useMemo(
    () => LEARN_MODULES.flatMap(m => m.lessons.map(l => ({ ...l, moduleId: m.id }))),
    []
  );
  const completedCount = progress.length;
  const totalMinutes = allLessons.reduce((acc, l) => acc + (l.minutes || 0), 0);

  const module = LEARN_MODULES[activeModule];
  const lesson = module.lessons[activeLesson];
  const lessonKey = `${module.id}::${lesson.id}`;
  const isDone = progress.includes(lessonKey);
  const flatIdx = allLessons.findIndex(l => l.moduleId === module.id && l.id === lesson.id);
  const prevLesson = flatIdx > 0 ? allLessons[flatIdx - 1] : null;
  const nextLesson = flatIdx < allLessons.length - 1 ? allLessons[flatIdx + 1] : null;

  const toggleComplete = () => {
    setProgress(p => (p.includes(lessonKey) ? p.filter(k => k !== lessonKey) : [...p, lessonKey]));
  };

  const gotoLesson = (modIdx, lesIdx) => {
    setActiveModule(modIdx);
    setActiveLesson(lesIdx);
    setView('lessons');
  };

  const gotoFlat = (l) => {
    const mIdx = LEARN_MODULES.findIndex(m => m.id === l.moduleId);
    const lIdx = LEARN_MODULES[mIdx].lessons.findIndex(x => x.id === l.id);
    gotoLesson(mIdx, lIdx);
  };

  const filteredGlossary = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(glossaryQuery.toLowerCase()) ||
    g.def.toLowerCase().includes(glossaryQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero */}
      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '10px', color: '#059669' }}>
                <GraduationCap size={24} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Trading Academy</h1>
              <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                BEGINNER FRIENDLY
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
              Learn the Indian markets step by step — basics, first trades, charts, risk and mindset.
              Every lesson links to a live practice action in the terminal.
            </p>
          </div>

          {/* Progress Card */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>
                {completedCount}/{allLessons.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Lessons done</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{totalMinutes}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Total minutes</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '14px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${allLessons.length ? (completedCount / allLessons.length) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* View Switcher */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className={`nav-tab ${view === 'lessons' ? 'active' : ''}`} onClick={() => setView('lessons')}>
          <BookOpen size={15} /> Lessons
        </button>
        <button className={`nav-tab ${view === 'glossary' ? 'active' : ''}`} onClick={() => setView('glossary')}>
          <Search size={15} /> Glossary ({GLOSSARY.length})
        </button>
      </div>

      {view === 'lessons' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px', alignItems: 'start' }}>
          <LessonSidebar
            activeModule={activeModule}
            activeLesson={activeLesson}
            progress={progress}
            gotoLesson={gotoLesson}
          />
          <LessonContent
            module={module}
            lesson={lesson}
            isDone={isDone}
            onToggleComplete={toggleComplete}
            prev={prevLesson}
            next={nextLesson}
            gotoFlat={gotoFlat}
            onNavigate={onNavigate}
          />
        </div>
      ) : (
        <GlossaryView query={glossaryQuery} setQuery={setGlossaryQuery} items={filteredGlossary} />
      )}
    </div>
  );
}

function LessonSidebar({ activeModule, activeLesson, progress, gotoLesson }) {
  return (
    <div className="glass-panel" style={{ padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Award size={14} color="#059669" /> Curriculum
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {LEARN_MODULES.map((m, mi) => {
          const Icon = MODULE_ICONS[m.icon] || BookOpen;
          const doneInModule = m.lessons.filter(l => progress.includes(`${m.id}::${l.id}`)).length;
          return (
            <div key={m.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Icon size={15} color={activeModule === mi ? '#059669' : '#64748b'} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: activeModule === mi ? '#059669' : '#0f172a' }}>{m.title}</span>
                <span className="font-mono" style={{ marginLeft: 'auto', fontSize: '0.68rem', color: doneInModule === m.lessons.length ? '#059669' : '#64748b', fontWeight: 600 }}>
                  {doneInModule}/{m.lessons.length}
                </span>
              </div>
              {m.lessons.map((l, li) => {
                const done = progress.includes(`${m.id}::${l.id}`);
                const isActive = activeModule === mi && activeLesson === li;
                return (
                  <button
                    key={l.id}
                    onClick={() => gotoLesson(mi, li)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      background: isActive ? '#ecfdf5' : 'transparent',
                      border: 'none', borderRadius: '6px', padding: '6px 8px',
                      cursor: 'pointer', textAlign: 'left', color: isActive ? '#047857' : '#475569',
                      fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {done ? <CheckCircle2 size={13} color="#059669" /> : <Clock size={13} color="#94a3b8" />}
                    <span style={{ flex: 1 }}>{l.title}</span>
                    <span className="font-mono" style={{ fontSize: '0.65rem', color: '#64748b' }}>{l.minutes}m</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LessonContent({ module, lesson, isDone, onToggleComplete, prev, next, gotoFlat, onNavigate }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
      {/* Module header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginBottom: '6px', flexWrap: 'wrap' }}>
        <span>{module.title}</span>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={{ color: '#64748b' }}>{module.description}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{lesson.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {lesson.minutes} min read
          </span>
          <button
            onClick={onToggleComplete}
            className={isDone ? 'btn-ghost' : 'btn-primary'}
            style={{ fontSize: '0.72rem', padding: '5px 10px' }}
          >
            <CheckCircle2 size={13} color={isDone ? '#059669' : 'currentColor'} />
            {isDone ? 'Completed' : 'Mark complete'}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {lesson.sections.map((s, i) => (
          <div key={i}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>{s.heading}</h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: '#475569', margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>

      {/* Key points */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginTop: '16px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Lightbulb size={13} /> Key takeaways
        </div>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {lesson.keyPoints.map((k, i) => (
            <li key={i} style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>{k}</li>
          ))}
        </ul>
      </div>

      {/* Practice CTA */}
      {lesson.tryIt && (
        <button
          onClick={() => onNavigate(lesson.tryIt.tab)}
          className="btn-primary"
          style={{ marginTop: '14px', padding: '10px 16px', fontSize: '0.85rem' }}
        >
          {lesson.tryIt.label} <ArrowRight size={14} />
        </button>
      )}

      {/* Prev / Next navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
        {prev ? (
          <button onClick={() => gotoFlat(prev)} className="btn-ghost" style={{ fontSize: '0.78rem' }}>
            <ChevronLeft size={14} /> {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button onClick={() => gotoFlat(next)} className="btn-ghost" style={{ fontSize: '0.78rem' }}>
            {next.title} <ChevronRight size={14} />
          </button>
        ) : <span />}
      </div>
    </div>
  );
}

function GlossaryView({ query, setQuery, items }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
        Market Glossary
      </h2>
      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px 0' }}>
        Quick reference for common Indian stock market terms. Tap any term while you trade to refresh your memory.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
        <Search size={15} color="#64748b" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms e.g. CNC, STT, EMA, circuit..."
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#0f172a', fontSize: '0.85rem', outline: 'none' }}
        />
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          No glossary terms match your search.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {items.map(g => (
            <div key={g.term} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>{g.term}</div>
              <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>{g.def}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}