"use client";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Cloud,
  Code2,
  Github,
  Handshake,
  Linkedin,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type FormState = {
  name: string;
  email: string;
  subject: string;
  projectType: string;
  message: string;
  website: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  subject: "",
  projectType: "",
  message: "",
  website: "",
};

const typingPhrases = [
  "Software Engineer from Fiji",
  "Building cloud-native integration platforms",
  "Working with GCP, AI and full-stack technologies",
  "Turning complex problems into simple solutions",
];

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const [typedText, setTypedText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const messageCount = useMemo(() => form.message.length, [form.message]);

  useEffect(() => {
    const phrase = typingPhrases[phraseIndex];
    const isComplete = !isDeleting && typedText === phrase;
    const isEmpty = isDeleting && typedText.length === 0;

    const timeout = window.setTimeout(() => {
      if (isComplete) {
        setIsDeleting(true);
        return;
      }

      if (isEmpty) {
        setIsDeleting(false);
        setPhraseIndex((current) => (current + 1) % typingPhrases.length);
        return;
      }

      const nextLength = typedText.length + (isDeleting ? -1 : 1);
      setTypedText(phrase.slice(0, Math.max(0, nextLength)));
    }, isComplete ? 1450 : isEmpty ? 260 : isDeleting ? 34 : 68);

    return () => window.clearTimeout(timeout);
  }, [isDeleting, phraseIndex, typedText]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (status === "error") {
      setStatus("idle");
      setFeedback("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "Your message could not be sent.");
      }

      setStatus("success");
      setFeedback(result.message || "Your message has been sent successfully.");
      setForm(initialForm);
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <main className="site-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="https://github.com/SMani0547" aria-label="Open Shiva's GitHub profile">
          <span className="brand-mark"><Code2 size={20} /></span>
          <span>
            <strong>Shiva Mani Goundar</strong>
            <small>Software Engineer · Fiji</small>
          </span>
        </a>

        <nav className="social-links" aria-label="Social links">
          <a href="https://github.com/SMani0547" aria-label="GitHub"><Github size={19} /></a>
          <a href="https://www.linkedin.com/in/shiva-goundar-270a901b9" aria-label="LinkedIn"><Linkedin size={19} /></a>
          <a href="mailto:shivamanigoundar101@gmail.com" aria-label="Email"><Mail size={19} /></a>
        </nav>
      </header>


      <div className="typing-stage" aria-live="polite" aria-label={`Current focus: ${typingPhrases[phraseIndex]}`}>
        <span className="typing-value">{typedText}</span>
        <span className="typing-cursor" aria-hidden="true" />
      </div>

      <section className="contact-layout">
        <aside className="intro-panel">
          <a className="back-link" href="https://github.com/SMani0547">
            <ArrowLeft size={17} /> Back to GitHub profile
          </a>

         

          <h1>Let&apos;s build something <span>meaningful.</span></h1>

        

       

          <div className="contact-meta">
            <div>
              <span className="meta-icon"><Mail size={18} /></span>
              <span><small>Email</small><strong>shivamanigoundar101@gmail.com</strong></span>
            </div>
            <div>
              <span className="meta-icon"><Mail size={18} /></span>
              <span><small>Secondary Email</small><strong>smg0547@gmail.com</strong></span>
            </div>
            <div>
              <span className="meta-icon"><MapPin size={18} /></span>
              <span><small>Location</small><strong>Fiji Islands</strong></span>
            </div>
          </div>

          <div className="privacy-note">
            <ShieldCheck size={18} />
            <span>Your details are used only to respond to your enquiry.</span>
          </div>
        </aside>

        <section className="form-card" aria-labelledby="contact-form-title">
          <div className="form-heading">
            <span className="form-icon"><Handshake size={25} /></span>
            <div>
              <p>Start a conversation</p>
              <h2 id="contact-form-title">Send a message</h2>
            </div>
          </div>

          {status === "success" ? (
            <div className="success-panel" role="status">
              <span><CheckCircle2 size={35} /></span>
              <h3>Message received</h3>
              <p>{feedback}</p>
              <button type="button" onClick={() => { setStatus("idle"); setFeedback(""); }}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => updateField("website", event.target.value)}
                />
              </div>

              <div className="form-row">
                <label>
                  <span>Name <b>*</b></span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    
                    minLength={2}
                    maxLength={80}
                    required
                    autoComplete="name"
                  />
                </label>

                <label>
                  <span>Email <b>*</b></span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                   
                    maxLength={120}
                    required
                    autoComplete="email"
                  />
                </label>
              </div>

              <label>
                <span>Subject <b>*</b></span>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                  
                  minLength={3}
                  maxLength={120}
                  required
                />
              </label>

              <label>
                <span>Project type</span>
                <select
                  name="projectType"
                  value={form.projectType}
                  onChange={(event) => updateField("projectType", event.target.value)}
                >
                  <option value="">Select an option</option>
                  <option value="Software Development">Software development</option>
                  <option value="Cloud & System Integration">Cloud &amp; system integration</option>
                  <option value="AI & Automation">AI &amp; automation</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Other">Other enquiry</option>
                </select>
              </label>

              <label>
                <span>Message <b>*</b></span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  
                  minLength={10}
                  maxLength={2000}
                  rows={7}
                  required
                />
                <small className="character-count">{messageCount}/2000</small>
              </label>

              {status === "error" && <div className="form-alert error" role="alert">{feedback}</div>}

              <button className="submit-button" type="submit" disabled={status === "sending"}>
                {status === "sending" ? (
                  <><LoaderCircle className="spinner" size={19} /> Sending message...</>
                ) : (
                  <><Send size={19} /> Send message</>
                )}
              </button>

              <p className="response-time">Typical response time: within 1–2 business days.</p>
            </form>
          )}
        </section>
      </section>

      <footer>
        <span>© {new Date().getFullYear()} Shiva Mani Goundar</span>
        <span>Built with Next.js and deployed on Vercel</span>
      </footer>
    </main>
  );
}
