import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  Coffee,
  Copy,
  HeartHandshake,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  TrainFront,
  Utensils,
} from 'lucide-react';
import './tokens.css';
import './design-system.css';

const principles = ['Soft', 'Useful', 'Local', 'Kind'];

const materials = [
  { name: 'Morning Paper', value: '#F8F2E3', note: 'background' },
  { name: 'Cream Card', value: '#FFFDF7', note: 'surface' },
  { name: 'Sunlit Slip', value: '#F1DF9B', note: 'main warmth' },
  { name: 'Postcard Edge', value: '#F3E8C9', note: 'soft section' },
  { name: 'Soft Sage', value: '#7C8D7C', note: 'quiet accent' },
  { name: 'Travel Clay', value: '#AD7F65', note: 'small detail' },
];

export function DesignSystemPreview({ onBack }: { onBack: () => void }) {
  return (
    <section className="ds-screen">
      <div className="ds-shell">
        <div className="ds-topline">
          <button className="ds-back" type="button" onClick={onBack} aria-label="Back">
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
          <span className="ds-postmark">Shanghai · 08:42</span>
        </div>

        <header className="ds-journal-hero">
          <span className="ds-soft-caption">A small travel notebook for China</span>
          <div>
            <h1 className="ds-brand-title">Orienta</h1>
            <p className="ds-brand-line">A quiet companion for finding your way.</p>
          </div>
          <p className="ds-hand-note">Designed like a warm little city guide, powered quietly in the background.</p>
          <div className="ds-principles">
            {principles.map((principle) => <span className="ds-principle" key={principle}>{principle}</span>)}
          </div>
        </header>

        <section className="ds-block">
          <div className="ds-block-intro">
            <span className="ds-page-number">page 01</span>
            <h2 className="ds-block-title">Cream, paper, and soft morning light.</h2>
            <p className="ds-block-copy">The system should feel like stationery from a quiet guesthouse: useful, warm, and easy to trust.</p>
          </div>
          <div className="ds-warm-strip">
            {materials.map((material) => (
              <div className="ds-swatch-row" key={material.name}>
                <span className="ds-swatch-dot" style={{ '--swatch': material.value } as React.CSSProperties} />
                <span><strong>{material.name}</strong><small>{material.note} · {material.value}</small></span>
              </div>
            ))}
          </div>
        </section>

        <section className="ds-block">
          <div className="ds-block-intro">
            <span className="ds-page-number">page 02</span>
            <h2 className="ds-block-title">Typography should sound like a person, not a pitch deck.</h2>
          </div>
          <div className="ds-type-card">
            <p className="ds-type-display">What do you need help with?</p>
            <p className="ds-type-body">Soft serif headings create the journal feeling. Practical text stays simple, readable, and direct for travelers using the app in real places.</p>
          </div>
        </section>

        <section className="ds-block">
          <div className="ds-block-intro">
            <span className="ds-page-number">page 03</span>
            <h2 className="ds-block-title">Actions feel calm, but never vague.</h2>
          </div>
          <div className="ds-button-row">
            <button className="ds-button primary" type="button"><Search size={17} aria-hidden="true" />Understand Product</button>
            <button className="ds-button secondary" type="button"><Copy size={17} aria-hidden="true" />Copy Chinese</button>
            <button className="ds-button text" type="button"><MessageCircle size={17} aria-hidden="true" />Ask a Local</button>
            <button className="ds-button emergency" type="button"><Phone size={17} aria-hidden="true" />Call 110</button>
          </div>
        </section>

        <section className="ds-block">
          <div className="ds-block-intro">
            <span className="ds-page-number">page 04</span>
            <h2 className="ds-block-title">Cards should feel like travel objects.</h2>
          </div>
          <div className="ds-travel-notes">
            <article className="ds-note-card yellow">
              <div className="ds-note-meta"><span>restaurant note</span><Utensils size={16} aria-hidden="true" /></div>
              <strong>Restaurant assistant</strong>
              <p>Translate menus, explore dishes, or show a phrase to staff without feeling like a translation app.</p>
            </article>
            <article className="ds-note-card">
              <div className="ds-note-meta"><span>local help</span><HeartHandshake size={16} aria-hidden="true" /></div>
              <strong>Ask a Local</strong>
              <p>A private question, answered by a real person, with an email reply when it is ready.</p>
            </article>
          </div>
          <div>
            <div className="ds-mini-row">
              <span className="ds-mini-icon"><TrainFront size={17} aria-hidden="true" /></span>
              <span><strong>High-speed Rail</strong><small>Read the ticket. Find the coach. Find the seat.</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </div>
            <div className="ds-mini-row">
              <span className="ds-mini-icon"><Coffee size={17} aria-hidden="true" /></span>
              <span><strong>Shopping</strong><small>Understand what you are buying before you pay.</small></span>
              <ChevronRight size={18} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="ds-block">
          <div className="ds-block-intro">
            <span className="ds-page-number">page 05</span>
            <h2 className="ds-block-title">Forms are plain, generous, and friendly.</h2>
          </div>
          <label className="ds-field">
            <span>Place or address</span>
            <input className="ds-input" placeholder="No. 300 East Nanjing Road, Shanghai" />
          </label>
          <label className="ds-field">
            <span>Question for a local</span>
            <textarea className="ds-textarea" placeholder="Ask anything about traveling in China..." />
          </label>
        </section>

        <section className="ds-block">
          <div className="ds-block-intro">
            <span className="ds-page-number">page 06</span>
            <h2 className="ds-block-title">States should reassure, not alarm.</h2>
          </div>
          <div className="ds-state-list">
            <div className="ds-notice success"><Check size={17} aria-hidden="true" /> Reply published and email sent.</div>
            <div className="ds-notice empty"><CircleAlert size={17} aria-hidden="true" /> No answer yet. We will email you when a local replies.</div>
            <div className="ds-notice error"><CircleAlert size={17} aria-hidden="true" /> We could not read this image. Try a clearer photo.</div>
            <div className="ds-notice"><Loader2 className="ds-spinner" size={17} aria-hidden="true" /> Formatting your address...</div>
          </div>
        </section>

        <section className="ds-block">
          <div className="ds-block-intro">
            <span className="ds-page-number">sample screen</span>
            <h2 className="ds-block-title">A believable product world, not a component dump.</h2>
          </div>
          <div className="ds-phone-sample">
            <div className="ds-sample-header">
              <span className="ds-sample-brand"><strong>Orienta</strong><small>Travel in China with confidence.</small></span>
              <MapPin size={21} aria-hidden="true" />
            </div>
            <h2 className="ds-sample-title">What do you need help with?</h2>
            <div className="ds-sample-stack">
              <div className="ds-sample-slip yellow">
                <span><strong>Restaurant</strong><span>Menus, dishes, and words for staff.</span></span>
                <Utensils size={18} aria-hidden="true" />
              </div>
              <div className="ds-sample-slip">
                <span><strong>Address Helper</strong><span>Show a clean destination card to a driver.</span></span>
                <MapPin size={18} aria-hidden="true" />
              </div>
              <div className="ds-sample-slip emergency">
                <span><strong>Emergency</strong><span>Police, ambulance, fire, traffic accident.</span></span>
                <Phone size={18} aria-hidden="true" />
              </div>
            </div>
            <article className="ds-address-card">
              <small>Show this to your driver</small>
              <strong>上海市黄浦区南京东路300号</strong>
              <small>No. 300 East Nanjing Road, Huangpu District, Shanghai</small>
            </article>
            <article className="ds-display-card">
              <small>Show to staff</small>
              <div className="ds-chinese-large">请不要放辣。</div>
              <small>No spicy food, please.</small>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
