import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Check,
  Compass,
  ExternalLink,
  MapPinned,
  Plane,
  Route,
  Search,
} from 'lucide-react';
import auFlag from 'flag-icons/flags/4x3/au.svg';
import brFlag from 'flag-icons/flags/4x3/br.svg';
import caFlag from 'flag-icons/flags/4x3/ca.svg';
import deFlag from 'flag-icons/flags/4x3/de.svg';
import esFlag from 'flag-icons/flags/4x3/es.svg';
import frFlag from 'flag-icons/flags/4x3/fr.svg';
import gbFlag from 'flag-icons/flags/4x3/gb.svg';
import inFlag from 'flag-icons/flags/4x3/in.svg';
import itFlag from 'flag-icons/flags/4x3/it.svg';
import jpFlag from 'flag-icons/flags/4x3/jp.svg';
import krFlag from 'flag-icons/flags/4x3/kr.svg';
import mxFlag from 'flag-icons/flags/4x3/mx.svg';
import myFlag from 'flag-icons/flags/4x3/my.svg';
import nlFlag from 'flag-icons/flags/4x3/nl.svg';
import noFlag from 'flag-icons/flags/4x3/no.svg';
import nzFlag from 'flag-icons/flags/4x3/nz.svg';
import seFlag from 'flag-icons/flags/4x3/se.svg';
import sgFlag from 'flag-icons/flags/4x3/sg.svg';
import thFlag from 'flag-icons/flags/4x3/th.svg';
import usFlag from 'flag-icons/flags/4x3/us.svg';
import './styles.css';

type Page =
  | 'welcome'
  | 'journey-stage'
  | 'passport-country'
  | 'arrival-date'
  | 'departure-date'
  | 'calculating-stay'
  | 'visa-result';
type JourneyStage = 'planning' | 'preparing' | 'in-china';

type Country = {
  code: string;
  name: string;
  flagSrc: string;
  aliases?: string[];
  common?: boolean;
};

// CT Design Rules: one decision per screen, mobile-first, one primary action,
// question-first layout, simple English, no unnecessary information, clear next step.
const journeyOptions: Array<{
  id: JourneyStage;
  title: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}> = [
  {
    id: 'planning',
    title: 'Planning',
    description: "I'm exploring or planning a trip.",
    icon: <Compass aria-hidden="true" />,
    available: false,
  },
  {
    id: 'preparing',
    title: 'Preparing',
    description: 'My China trip is decided or booked.',
    icon: <Route aria-hidden="true" />,
    available: true,
  },
  {
    id: 'in-china',
    title: 'Already in China',
    description: "I've already arrived in China.",
    icon: <MapPinned aria-hidden="true" />,
    available: false,
  },
];

const countries: Country[] = [
  { code: 'US', name: 'United States', flagSrc: usFlag, aliases: ['usa', 'america', 'us'], common: true },
  { code: 'GB', name: 'United Kingdom', flagSrc: gbFlag, aliases: ['uk', 'britain', 'england'], common: true },
  { code: 'CA', name: 'Canada', flagSrc: caFlag, common: true },
  { code: 'AU', name: 'Australia', flagSrc: auFlag, common: true },
  { code: 'DE', name: 'Germany', flagSrc: deFlag, common: true },
  { code: 'FR', name: 'France', flagSrc: frFlag, common: true },
  { code: 'IT', name: 'Italy', flagSrc: itFlag },
  { code: 'ES', name: 'Spain', flagSrc: esFlag },
  { code: 'NL', name: 'Netherlands', flagSrc: nlFlag, aliases: ['holland'] },
  { code: 'SE', name: 'Sweden', flagSrc: seFlag },
  { code: 'NO', name: 'Norway', flagSrc: noFlag },
  { code: 'JP', name: 'Japan', flagSrc: jpFlag },
  { code: 'KR', name: 'South Korea', flagSrc: krFlag, aliases: ['korea'] },
  { code: 'SG', name: 'Singapore', flagSrc: sgFlag },
  { code: 'MY', name: 'Malaysia', flagSrc: myFlag },
  { code: 'TH', name: 'Thailand', flagSrc: thFlag },
  { code: 'NZ', name: 'New Zealand', flagSrc: nzFlag },
  { code: 'BR', name: 'Brazil', flagSrc: brFlag },
  { code: 'MX', name: 'Mexico', flagSrc: mxFlag },
  { code: 'IN', name: 'India', flagSrc: inFlag },
];

function App() {
  const [page, setPage] = useState<Page>('welcome');
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const plannedStayDays = calculatePlannedStayDays(arrivalDate, departureDate);

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {page === 'welcome' && <WelcomePage onStart={() => setPage('journey-stage')} />}

        {page === 'journey-stage' && (
          <JourneyStagePage
            selectedStage={selectedStage}
            onBack={() => setPage('welcome')}
            onSelect={(stage) => {
              setSelectedStage(stage);
              if (stage === 'preparing') {
                setPage('passport-country');
              }
            }}
          />
        )}

        {page === 'passport-country' && (
          <PassportCountryPage
            selectedCountry={selectedCountry}
            onBack={() => setPage('journey-stage')}
            onSelect={setSelectedCountry}
            onContinue={() => setPage('arrival-date')}
          />
        )}

        {page === 'arrival-date' && (
          <ArrivalDatePage
            arrivalDate={arrivalDate}
            onBack={() => setPage('passport-country')}
            onChange={setArrivalDate}
            onContinue={() => setPage('departure-date')}
          />
        )}

        {page === 'departure-date' && (
          <DepartureDatePage
            arrivalDate={arrivalDate}
            departureDate={departureDate}
            onBack={() => setPage('arrival-date')}
            onChange={setDepartureDate}
            onContinue={() => setPage('calculating-stay')}
          />
        )}

        {page === 'calculating-stay' && (
          <CalculatingStayPage onDone={() => setPage('visa-result')} />
        )}

        {page === 'visa-result' && (
          <VisaResultPage
            arrivalDate={arrivalDate}
            departureDate={departureDate}
            plannedStayDays={plannedStayDays}
            selectedCountry={selectedCountry}
            onBack={() => setPage('departure-date')}
          />
        )}
      </div>
    </main>
  );
}

function WelcomePage({ onStart }: { onStart: () => void }) {
  return (
    <section className="screen welcome-screen" aria-labelledby="welcome-title">
      <div className="brand-row">
        <span className="brand-mark">
          <Plane size={18} aria-hidden="true" />
        </span>
        <span>CT Project</span>
      </div>

      <div className="travel-line" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="welcome-copy">
        <p className="eyebrow">CT Project</p>
        <h1 id="welcome-title">Your China trip, one step at a time.</h1>
        <p className="lead">
          We'll guide you through visa checks, trip preparation, arrival and travel in China -
          step by step.
        </p>
      </div>

      <button className="primary-button" type="button" onClick={onStart}>
        Start My Journey
        <ArrowRight size={20} aria-hidden="true" />
      </button>
    </section>
  );
}

function JourneyStagePage({
  selectedStage,
  onBack,
  onSelect,
}: {
  selectedStage: JourneyStage | null;
  onBack: () => void;
  onSelect: (stage: JourneyStage) => void;
}) {
  return (
    <section className="screen stage-screen" aria-labelledby="stage-title">
      <header className="top-bar">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span className="progress-stage" />
      </div>

      <div className="stage-copy">
        <p className="eyebrow">Journey Stage</p>
        <h1 id="stage-title">Where are you in your China journey?</h1>
      </div>

      <div className="option-list">
        {journeyOptions.map((option) => (
          <button
            className={`stage-option ${selectedStage === option.id ? 'selected' : ''}`}
            disabled={!option.available}
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
          >
            <span className="option-icon">{option.icon}</span>
            <span>
              <strong>
                {option.title}
                {!option.available ? <em>Coming soon</em> : null}
              </strong>
              <small>{option.description}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PassportCountryPage({
  selectedCountry,
  onBack,
  onSelect,
  onContinue,
}: {
  selectedCountry: Country | null;
  onBack: () => void;
  onSelect: (country: Country) => void;
  onContinue: () => void;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const visibleCountries = countries.filter((country) => countryMatches(country, normalizedQuery));
  const commonCountries = isSearching
    ? visibleCountries.filter((country) => country.common)
    : countries.filter((country) => country.common);
  const otherCountries = isSearching
    ? visibleCountries.filter((country) => !country.common)
    : [];

  return (
    <section className="screen passport-screen" aria-labelledby="passport-title">
      <header className="top-bar">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span className="progress-passport" />
      </div>

      <div className="page-copy">
        <p className="eyebrow">Passport Country</p>
        <h1 id="passport-title">Which passport are you traveling with?</h1>
        <p className="lead small-lead">Choose the country that issued your passport.</p>
      </div>

      <label className="search-field">
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search country"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="country-list" aria-label="Passport countries">
        <CountryGroup
          title="Common countries"
          countries={commonCountries}
          selectedCountry={selectedCountry}
          onSelect={onSelect}
        />

        {isSearching ? (
          <CountryGroup
            title="All countries"
            countries={otherCountries}
            selectedCountry={selectedCountry}
            onSelect={onSelect}
          />
        ) : null}
      </div>

      <button
        className="primary-button footer-button"
        type="button"
        disabled={!selectedCountry}
        onClick={onContinue}
      >
        Continue
        <ArrowRight size={20} aria-hidden="true" />
      </button>
    </section>
  );
}

function countryMatches(country: Country, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true;
  }

  return (
    country.name.toLowerCase().includes(normalizedQuery) ||
    country.code.toLowerCase().includes(normalizedQuery) ||
    Boolean(country.aliases?.some((alias) => alias.includes(normalizedQuery)))
  );
}

function CountryGroup({
  title,
  countries,
  selectedCountry,
  onSelect,
}: {
  title: string;
  countries: Country[];
  selectedCountry: Country | null;
  onSelect: (country: Country) => void;
}) {
  if (countries.length === 0) {
    return null;
  }

  return (
    <section className="country-group" aria-label={title}>
      <h2>{title}</h2>
      <div className="country-options">
        {countries.map((country) => {
          const isSelected = selectedCountry?.code === country.code;

          return (
            <button
              className={`country-option ${isSelected ? 'selected' : ''}`}
              key={country.code}
              type="button"
              onClick={() => onSelect(country)}
            >
              <span className="country-main">
                <span className="country-flag" aria-hidden="true">
                  <img src={country.flagSrc} alt="" />
                </span>
                <span>
                  <strong>{country.name}</strong>
                  <small>{country.code}</small>
                </span>
              </span>
              {isSelected ? <Check size={19} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ArrivalDatePage({
  arrivalDate,
  onBack,
  onChange,
  onContinue,
}: {
  arrivalDate: string;
  onBack: () => void;
  onChange: (date: string) => void;
  onContinue: () => void;
}) {
  return (
    <section className="screen arrival-screen" aria-labelledby="arrival-title">
      <header className="top-bar">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span className="progress-arrival" />
      </div>

      <div className="page-copy">
        <p className="eyebrow">Arrival Date</p>
        <h1 id="arrival-title">When will you arrive in China?</h1>
        <p className="lead small-lead">
          We'll use your arrival date to determine your visa eligibility.
        </p>
      </div>

      <label className="date-field">
        <span>Arrival date</span>
        <input
          type="date"
          value={arrivalDate}
          onChange={(event) => onChange(event.target.value)}
          onInput={(event) => onChange(event.currentTarget.value)}
        />
      </label>

      <button
        className="primary-button footer-button"
        type="button"
        disabled={!arrivalDate}
        onClick={onContinue}
      >
        Continue
        <ArrowRight size={20} aria-hidden="true" />
      </button>
    </section>
  );
}

function DepartureDatePage({
  arrivalDate,
  departureDate,
  onBack,
  onChange,
  onContinue,
}: {
  arrivalDate: string;
  departureDate: string;
  onBack: () => void;
  onChange: (date: string) => void;
  onContinue: () => void;
}) {
  const hasInvalidDateOrder =
    Boolean(arrivalDate && departureDate) && new Date(departureDate) < new Date(arrivalDate);
  const canContinue = Boolean(departureDate) && !hasInvalidDateOrder;

  return (
    <section className="screen departure-screen" aria-labelledby="departure-title">
      <header className="top-bar">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span className="progress-departure" />
      </div>

      <div className="page-copy">
        <p className="eyebrow">Departure Date</p>
        <h1 id="departure-title">When will you leave China?</h1>
        <p className="lead small-lead">This helps calculate your planned stay.</p>
      </div>

      <label className="date-field">
        <span>Departure date</span>
        <input
          type="date"
          value={departureDate}
          onChange={(event) => onChange(event.target.value)}
          onInput={(event) => onChange(event.currentTarget.value)}
        />
        {hasInvalidDateOrder ? (
          <small className="field-error">Choose a date on or after your arrival date.</small>
        ) : null}
      </label>

      <button
        className="primary-button footer-button"
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continue
        <ArrowRight size={20} aria-hidden="true" />
      </button>
    </section>
  );
}

function CalculatingStayPage({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 850);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <section className="screen calculating-screen" aria-live="polite" aria-busy="true">
      <div className="calculation-status">
        <span className="spinner" aria-hidden="true" />
        <h1>Calculating your planned stay...</h1>
      </div>
    </section>
  );
}

function VisaResultPage({
  selectedCountry,
  arrivalDate,
  departureDate,
  plannedStayDays,
  onBack,
}: {
  selectedCountry: Country | null;
  arrivalDate: string;
  departureDate: string;
  plannedStayDays: number | null;
  onBack: () => void;
}) {
  return (
    <section className="screen visa-result-screen" aria-labelledby="visa-result-title">
      <header className="top-bar">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
      </header>

      <div className="progress-track" aria-hidden="true">
        <span className="progress-visa" />
      </div>

      <div className="page-copy">
        <p className="eyebrow">Visa Result</p>
        <h1 id="visa-result-title">We could not confidently confirm your visa status.</h1>
        <p className="lead small-lead">
          Please check official information before you travel.
        </p>
      </div>

      <div className="result-card" aria-label="Visa check details">
        <div className="result-status">
          <span className="status-icon">
            <AlertTriangle size={20} aria-hidden="true" />
          </span>
          <span>Official confirmation required</span>
        </div>

        <dl className="result-details">
          <div>
            <dt>Passport</dt>
            <dd>{selectedCountry?.name ?? 'Not selected'}</dd>
          </div>
          <div>
            <dt>Arrival</dt>
            <dd>{formatDateForDisplay(arrivalDate)}</dd>
          </div>
          <div>
            <dt>Departure</dt>
            <dd>{formatDateForDisplay(departureDate)}</dd>
          </div>
          <div>
            <dt>Planned stay</dt>
            <dd>{plannedStayDays ? `${plannedStayDays} days` : 'Unable to calculate'}</dd>
          </div>
        </dl>
      </div>

      <p className="risk-note">
        Final entry and visa decisions are made by Chinese authorities.
      </p>

      <button className="primary-button footer-button" type="button">
        Check Official Information
        <ExternalLink size={18} aria-hidden="true" />
      </button>
    </section>
  );
}

function calculatePlannedStayDays(arrivalDate: string, departureDate: string) {
  if (!arrivalDate || !departureDate) {
    return null;
  }

  const arrival = new Date(`${arrivalDate}T00:00:00`);
  const departure = new Date(`${departureDate}T00:00:00`);
  const diffDays = Math.round((departure.getTime() - arrival.getTime()) / 86_400_000);

  if (Number.isNaN(diffDays) || diffDays < 0) {
    return null;
  }

  return Math.max(diffDays, 1);
}

function formatDateForDisplay(date: string) {
  if (!date) {
    return 'Not selected';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
