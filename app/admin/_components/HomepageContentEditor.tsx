"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { saveHomepageContentAction } from "@/app/_lib/db/actions";
import type { HomepageContent, HeroSlideContent } from "@/app/_lib/db/homepage-content";
import { useAdminLocale } from "../_lib/i18n-admin";
import { useAdminToast } from "./AdminToast";
import { DemoBanner, PageHeader } from "./PageHeader";
import { ImageUploader } from "./ImageUploader";

type Cat = { key: string; en: string; ar: string; fr: string };
type Tab = "marquee" | "hero" | "banners" | "story";

export function HomepageContentEditor({
  initialContent,
  categories,
  dbReady = false,
}: {
  initialContent: HomepageContent;
  categories: Cat[];
  dbReady?: boolean;
}) {
  const { d } = useAdminLocale();
  const { push } = useAdminToast();
  const [pending, start] = useTransition();
  const [content, setContent] = useState<HomepageContent>(initialContent);
  const [snapshot, setSnapshot] = useState<HomepageContent>(initialContent);
  const [tab, setTab] = useState<Tab>("marquee");

  const dirty = JSON.stringify(content) !== JSON.stringify(snapshot);

  const save = () => {
    if (!dbReady || !dirty) return;
    start(async () => {
      try {
        await saveHomepageContentAction(content);
        push("Homepage content saved", "success");
        setSnapshot(content);
      } catch (err) {
        push(err instanceof Error ? err.message : "Save failed", "error");
      }
    });
  };

  const reset = () => setContent(snapshot);

  // ── Marquee handlers ──
  const setMarqueeRow = (lang: "en" | "ar" | "fr", index: number, value: string) =>
    setContent((c) => ({
      ...c,
      marquee: {
        ...c.marquee,
        [lang]: c.marquee[lang].map((v, i) => (i === index ? value : v)),
      },
    }));
  const addMarqueeRow = () =>
    setContent((c) => ({
      ...c,
      marquee: {
        en: [...c.marquee.en, ""],
        ar: [...c.marquee.ar, ""],
        fr: [...c.marquee.fr, ""],
      },
    }));
  const removeMarqueeRow = (index: number) =>
    setContent((c) => ({
      ...c,
      marquee: {
        en: c.marquee.en.filter((_, i) => i !== index),
        ar: c.marquee.ar.filter((_, i) => i !== index),
        fr: c.marquee.fr.filter((_, i) => i !== index),
      },
    }));

  // ── Hero handlers ──
  const setHero = (idx: number, patch: Partial<HeroSlideContent>) =>
    setContent((c) => ({
      ...c,
      hero: c.hero.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  const setHeroText = (idx: number, field: "eyebrow" | "title" | "sub" | "cta", lang: "en" | "ar" | "fr", value: string) =>
    setContent((c) => ({
      ...c,
      hero: c.hero.map((s, i) =>
        i === idx ? { ...s, [field]: { ...s[field], [lang]: value } } : s,
      ),
    }));
  const addHeroSlide = () =>
    setContent((c) => ({
      ...c,
      hero: [
        ...c.hero,
        {
          eyebrow: { en: "", ar: "", fr: "" },
          title: { en: "", ar: "", fr: "" },
          sub: { en: "", ar: "", fr: "" },
          cta: { en: "", ar: "", fr: "" },
          image: "",
          align: "start",
        },
      ],
    }));
  const removeHeroSlide = (idx: number) =>
    setContent((c) => ({ ...c, hero: c.hero.filter((_, i) => i !== idx) }));
  const moveHero = (idx: number, dir: -1 | 1) =>
    setContent((c) => {
      const next = [...c.hero];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return c;
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...c, hero: next };
    });

  // ── Story handlers ──
  const setStoryText = (field: "eyebrow" | "title" | "body", lang: "en" | "ar" | "fr", value: string) =>
    setContent((c) => ({
      ...c,
      story: {
        ...c.story,
        [field]: { ...(c.story[field] ?? { en: "", ar: "", fr: "" }), [lang]: value },
      },
    }));
  const setStoryImage = (url: string) =>
    setContent((c) => ({ ...c, story: { ...c.story, image: url } }));

  // ── Banners handlers ──
  const setBannerImage = (key: string, url: string) =>
    setContent((c) => ({ ...c, categoryBanners: { ...c.categoryBanners, [key]: url } }));

  return (
    <>
      <PageHeader
        title="Homepage content"
        subtitle="Replace images, edit the marquee strip, rewrite story copy — all visible on the storefront within seconds."
        actions={
          <>
            <Link
              href="/admin/homepage"
              className="px-4 py-2 text-sm font-medium text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
            >
              ← Layout
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]"
            >
              Preview ↗
            </a>
            <button
              type="button"
              onClick={reset}
              disabled={!dirty || pending}
              className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)] disabled:opacity-40"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dbReady || !dirty || pending}
              className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-5 py-2 text-sm font-semibold rounded-sm hover:opacity-90 disabled:opacity-40"
            >
              {pending ? "Saving…" : dirty ? "Save changes" : "No changes"}
            </button>
          </>
        }
      />
      <div className="px-8 py-6 space-y-5">
        {!dbReady && <DemoBanner>{d.common.demo_banner}</DemoBanner>}

        <nav className="flex flex-wrap gap-1 border-b border-[var(--a-line)]">
          {(
            [
              ["marquee", "Marquee strip", "🎞"],
              ["hero", "Hero slides", "🖼"],
              ["banners", "Category banners", "🗂"],
              ["story", "Brand story", "📖"],
            ] as const
          ).map(([k, label, icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === k
                  ? "border-[var(--a-accent)] text-[var(--a-ink)]"
                  : "border-transparent text-[var(--a-ink-muted)] hover:text-[var(--a-ink)]"
              }`}
            >
              <span className="me-2">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {tab === "marquee" && (
          <section className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Marquee strip</h2>
              <p className="text-xs text-[var(--a-ink-muted)] mt-1">
                The scrolling announcement strip below the hero. Each row is one message in 3 languages. Add as many as you want.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--a-line-soft)] text-[10px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                  <tr>
                    <th className="text-start px-3 py-2 w-10">#</th>
                    <th className="text-start px-3 py-2">English</th>
                    <th className="text-start px-3 py-2">العربية</th>
                    <th className="text-start px-3 py-2">Français</th>
                    <th className="text-end px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--a-line-soft)]">
                  {content.marquee.en.map((_, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-[var(--a-ink-faint)] font-mono text-xs">{i + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          value={content.marquee.en[i] ?? ""}
                          onChange={(e) => setMarqueeRow("en", i, e.target.value)}
                          className="w-full border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={content.marquee.ar[i] ?? ""}
                          dir="rtl"
                          onChange={(e) => setMarqueeRow("ar", i, e.target.value)}
                          className="w-full border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={content.marquee.fr[i] ?? ""}
                          onChange={(e) => setMarqueeRow("fr", i, e.target.value)}
                          className="w-full border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-end">
                        <button
                          type="button"
                          onClick={() => removeMarqueeRow(i)}
                          className="px-2 py-1 text-xs border border-[var(--a-danger-line)] text-[var(--a-danger)] hover:bg-[var(--a-danger-bg)] rounded-sm"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addMarqueeRow}
              className="px-3 py-1.5 text-xs font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] rounded-sm"
            >
              + Add row
            </button>
          </section>
        )}

        {tab === "hero" && (
          <section className="space-y-4">
            <div className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5">
              <h2 className="text-sm font-semibold tracking-wide">Hero slides</h2>
              <p className="text-xs text-[var(--a-ink-muted)] mt-1">
                The big rotating banner at the top of the storefront. Each slide has an image, eyebrow, title, subtitle, and a button.
              </p>
            </div>
            {content.hero.map((slide, idx) => (
              <article key={idx} className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Slide {idx + 1}</h3>
                  <div className="inline-flex gap-1">
                    <button type="button" onClick={() => moveHero(idx, -1)} disabled={idx === 0} className="px-2 py-1 text-xs border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)] disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => moveHero(idx, 1)} disabled={idx === content.hero.length - 1} className="px-2 py-1 text-xs border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)] disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => removeHeroSlide(idx)} className="px-2 py-1 text-xs border border-[var(--a-danger-line)] text-[var(--a-danger)] rounded-sm hover:bg-[var(--a-danger-bg)]">Remove</button>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium block mb-1.5">Background image</span>
                  <ImageUploader
                    name={`hero-${idx}`}
                    value={slide.image ? [slide.image] : []}
                    onChange={(urls) => setHero(idx, { image: urls[0] ?? "" })}
                    max={1}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["eyebrow", "title", "sub", "cta"] as const).map((field) => (
                    <div key={field} className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-2 border-t border-[var(--a-line)] pt-3 first:border-t-0 first:pt-0">
                      <div className="md:col-span-3 text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                        {field === "eyebrow" ? "Eyebrow (small label)" : field === "title" ? "Title (big headline)" : field === "sub" ? "Subtitle" : "Button text (CTA)"}
                      </div>
                      <input value={slide[field].en} onChange={(e) => setHeroText(idx, field, "en", e.target.value)} placeholder="English" className="border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm" />
                      <input value={slide[field].ar} dir="rtl" onChange={(e) => setHeroText(idx, field, "ar", e.target.value)} placeholder="العربية" className="border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm" />
                      <input value={slide[field].fr ?? ""} onChange={(e) => setHeroText(idx, field, "fr", e.target.value)} placeholder="Français" className="border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm" />
                    </div>
                  ))}
                </div>
                <div>
                  <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium block mb-1.5">Text alignment</span>
                  <div className="inline-flex border border-[var(--a-line)] rounded-sm overflow-hidden">
                    {(["start", "center", "end"] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setHero(idx, { align: a })}
                        className={`px-3 py-1.5 text-xs ${slide.align === a ? "bg-[var(--a-accent)] text-[var(--a-accent-fg)]" : "text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)]"}`}
                      >
                        {a === "start" ? "Left" : a === "center" ? "Center" : "Right"}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
            <button type="button" onClick={addHeroSlide} className="px-4 py-2 text-sm font-medium border border-[var(--a-line)] text-[var(--a-ink-soft)] hover:bg-[var(--a-line-soft)] rounded-sm">+ Add slide</button>
          </section>
        )}

        {tab === "banners" && (
          <section className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Category banner images</h2>
              <p className="text-xs text-[var(--a-ink-muted)] mt-1">
                The tiles in the "Shop by category" section. Upload a new image per category to override the default.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((c) => (
                <div key={c.key} className="border border-[var(--a-line)] rounded-md p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{c.en}</div>
                    <code className="text-[10px] text-[var(--a-ink-faint)]">{c.key}</code>
                  </div>
                  <ImageUploader
                    name={`banner-${c.key}`}
                    value={content.categoryBanners[c.key] ? [content.categoryBanners[c.key]] : []}
                    onChange={(urls) => setBannerImage(c.key, urls[0] ?? "")}
                    max={1}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "story" && (
          <section className="bg-[var(--a-surface)] border border-[var(--a-line)] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Brand story section</h2>
              <p className="text-xs text-[var(--a-ink-muted)] mt-1">
                The editorial image + copy block in the middle of the homepage.
              </p>
            </div>
            <div>
              <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium block mb-1.5">Image</span>
              <ImageUploader
                name="story-image"
                value={content.story.image ? [content.story.image] : []}
                onChange={(urls) => setStoryImage(urls[0] ?? "")}
                max={1}
              />
            </div>
            {(["eyebrow", "title", "body"] as const).map((field) => (
              <div key={field} className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t border-[var(--a-line)] pt-4">
                <div className="md:col-span-3 text-[11px] tracking-[0.2em] uppercase text-[var(--a-ink-muted)] font-medium">
                  {field === "eyebrow" ? "Eyebrow (small label above title)" : field === "title" ? "Title (big headline)" : "Body text"}
                </div>
                {field === "body" ? (
                  <>
                    <textarea value={content.story.body?.en ?? ""} onChange={(e) => setStoryText("body", "en", e.target.value)} rows={3} placeholder="English" className="border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm resize-none" />
                    <textarea value={content.story.body?.ar ?? ""} dir="rtl" onChange={(e) => setStoryText("body", "ar", e.target.value)} rows={3} placeholder="العربية" className="border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm resize-none" />
                    <textarea value={content.story.body?.fr ?? ""} onChange={(e) => setStoryText("body", "fr", e.target.value)} rows={3} placeholder="Français" className="border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm resize-none" />
                  </>
                ) : (
                  <>
                    <input value={content.story[field]?.en ?? ""} onChange={(e) => setStoryText(field, "en", e.target.value)} placeholder="English" className="border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm" />
                    <input value={content.story[field]?.ar ?? ""} dir="rtl" onChange={(e) => setStoryText(field, "ar", e.target.value)} placeholder="العربية" className="border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm" />
                    <input value={content.story[field]?.fr ?? ""} onChange={(e) => setStoryText(field, "fr", e.target.value)} placeholder="Français" className="border border-[var(--a-line)] px-2 py-1.5 text-sm bg-[var(--a-surface)] outline-none focus:border-[var(--a-ink)] rounded-sm" />
                  </>
                )}
              </div>
            ))}
          </section>
        )}

        {dirty && (
          <div className="sticky bottom-4 z-20 flex justify-center">
            <div className="bg-[var(--a-surface)] border border-[var(--a-line)] shadow-lg rounded-md px-4 py-2 flex items-center gap-3">
              <span className="text-sm font-medium">Unsaved changes</span>
              <button type="button" onClick={reset} disabled={pending} className="px-3 py-1.5 text-xs border border-[var(--a-line)] text-[var(--a-ink-soft)] rounded-sm hover:bg-[var(--a-line-soft)]">Discard</button>
              <button type="button" onClick={save} disabled={pending} className="bg-[var(--a-accent)] text-[var(--a-accent-fg)] px-4 py-1.5 text-xs font-semibold rounded-sm hover:opacity-90 disabled:opacity-40">{pending ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
