import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Camera,
  ChefHat,
  Copy,
  CreditCard,
  Landmark,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  ReceiptText,
  Search,
  Share2,
  ShoppingBag,
  ShoppingCart,
  TrainFront,
  Volume2,
} from 'lucide-react';
import { mockDishes, type Dish } from './data/dishes';
import { quickPhraseGroups, quickPhrases, type QuickPhrase } from './data/quickPhrases';
import { railCategoryLabels, railPhraseGroups, railPhrases } from './data/railPhrases';
import { shoppingPhraseGroups } from './data/shoppingPhrases';
import type { CategoryLabel, Phrase } from './data/types';
import { DesignSystemPreview } from './design-system/DesignSystemPreview';
import './styles.css';

const savedAddressesStorageKey = 'backpack.savedAddresses';
const askLocalDraftStorageKey = 'orienta.askLocalDraft';
const askLocalSubmittedStorageKey = 'orienta.askLocalSubmitted';

type Page =
  | 'home'
  | 'restaurant'
  | 'translate-menu'
  | 'menu-dish-detail'
  | 'restaurant-phrases'
  | 'explore-dish'
  | 'dish-processing'
  | 'dish-result'
  | 'taxi'
  | 'taxi-destination'
  | 'driver-card'
  | 'saved-addresses'
  | 'add-address'
  | 'rail'
  | 'rail-ticket'
  | 'rail-boarding-steps'
  | 'rail-before-station'
  | 'rail-station-gate'
  | 'rail-boarding-seat'
  | 'rail-issue'
  | 'rail-issue-result'
  | 'rail-phrases'
  | 'shopping'
  | 'understand-product'
  | 'currency-converter'
  | 'shopping-phrases'
  | 'emergency'
  | 'quick-phrases'
  | 'ask-local'
  | 'ask-local-submitted'
  | 'question-detail'
  | 'admin-login'
  | 'admin-questions'
  | 'admin-question-detail'
  | 'design-system'
  | 'display-card';

type Scenario = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  page: Page;
};

type Tool = {
  title: string;
  description: string;
  icon: React.ReactNode;
  page: Page;
  badge?: string;
};

type EmergencyService = {
  id: string;
  name: string;
  number: string;
  description: string;
  chinese: string;
  icon: React.ReactNode;
};

type DisplayContext = {
  phrase: Phrase;
  audience: 'Staff' | 'Driver' | 'Local Person' | 'Shop Staff';
  returnPage: Page;
  showLabel?: string;
  copyLabel?: string;
};

type SavedAddress = {
  id: string;
  label: 'Hotel' | 'Station' | 'Airport' | 'Custom' | string;
  placeName: string;
  chineseAddress: string;
  englishAddress?: string;
  note?: string;
  result?: AddressTranslationResult;
  lastUsedAt?: string;
};

type DriverCardSource = 'taxi-destination' | 'saved-addresses';

type AddressHelperSession = {
  input: string;
  city: string;
  district: string;
  landmark: string;
  result: AddressTranslationResult | null;
  warningResult: AddressTranslationResult | null;
  selectedSavedAddressId: string;
  savedScrollTop: number;
};

type TranslatedMenuItem = {
  id: string;
  original_name: string;
  translated_name: string;
  description: string;
  price: string;
  notes: string;
};

type TranslatedMenuSection = {
  id: string;
  title: string;
  items: TranslatedMenuItem[];
};

type TranslatedMenuResult = {
  restaurant_name: string;
  recognition_status: 'recognized' | 'uncertain' | 'unable_to_recognize';
  sections: TranslatedMenuSection[];
};

type RestaurantPhrase = Phrase & {
  situation: string;
};

type RestaurantPhraseGroup = {
  id: string;
  title: string;
  subtitle: string;
  phrases: RestaurantPhrase[];
};

type RestaurantMenuSession = {
  selectedFile: File | null;
  previewUrl: string;
  result: TranslatedMenuResult | null;
  selectedDishId: string;
  scrollTop: number;
};

type DishExploreResult = {
  englishName: string;
  chineseName: string;
  pinyin?: string;
  shortDescription: string;
  origin?: string;
  mainIngredients: string[];
  flavorProfile: string[];
  spiceLevel: 'Not spicy' | 'Mild' | 'Medium' | 'Spicy' | 'Very spicy';
  commonAllergens: string[];
  dietaryNotes: string[];
  howItIsServed: string;
  howToEat: string;
  portionGuide: string;
  beginnerFriendly: boolean;
  orderingPhraseChinese: string;
  orderingPhrasePinyin?: string;
  orderingPhraseEnglish: string;
  recognitionStatus: 'recognized' | 'uncertain' | 'unable_to_confirm';
};

type AddressInputType =
  | 'chinese_address'
  | 'english_address'
  | 'chinese_place_name'
  | 'english_place_name'
  | 'mixed'
  | 'unknown';

type ParsedAddress = {
  country?: string;
  province?: string;
  municipality?: string;
  city?: string;
  district?: string;
  county?: string;
  town?: string;
  subdistrict?: string;
  road?: string;
  roadDirection?: string;
  roadNumber?: string;
  lane?: string;
  alley?: string;
  building?: string;
  buildingNumber?: string;
  unit?: string;
  floor?: string;
  room?: string;
  landmark?: string;
  placeName?: string;
  entrance?: string;
  gate?: string;
  nearbyReference?: string;
};

type AddressTranslationResult = {
  inputType: AddressInputType;
  detectedLanguage: 'zh' | 'en' | 'mixed' | 'unknown';
  originalInput: string;
  chineseAddress: string;
  englishAddress: string;
  shortChineseLabel?: string;
  shortEnglishLabel?: string;
  parsedAddress: ParsedAddress;
  confidence: 'high' | 'medium' | 'low';
  isAmbiguous: boolean;
  needsMoreInformation: boolean;
  missingInformation?: string[];
  ambiguityMessage?: string;
  formattingNotes?: string[];
  verificationStatus: 'not_verified';
  driverCard: {
    destinationChinese: string;
    destinationEnglish: string;
    instructionChinese: string;
    instructionEnglish: string;
  };
};

type RailTicketResult = {
  recognitionStatus: 'recognized' | 'uncertain' | 'unable_to_recognize';
  sourceType: '12306' | 'trip_com' | 'china_railway_e_ticket' | 'order_screenshot' | 'unknown';
  trainNumber: string;
  fromStation: string;
  fromStationEnglish: string;
  toStation: string;
  toStationEnglish: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  carriage: string;
  seat: string;
  seatClass: string;
  passengerName: string;
  boardingGate: string;
  boardingGateEnglish: string;
  waitingHall: string;
  waitingHallEnglish: string;
  platform: string;
  platformEnglish: string;
  gate: string;
  gateEnglish: string;
  checkIn: string;
  checkInEnglish: string;
  coach: string;
  ticketNumber: string;
  orderNumber: string;
  notes: string[];
  confidence: 'high' | 'medium' | 'low';
  needsManualCheck: boolean;
};

type RailTicketSession = {
  selectedFile: File | null;
  previewUrl: string;
  result: RailTicketResult | null;
  scrollTop: number;
  error: string;
};

const emptyRailTicketSession: RailTicketSession = {
  selectedFile: null,
  previewUrl: '',
  result: null,
  scrollTop: 0,
  error: '',
};

type RailJourneyStepItem = {
  title: string;
  value?: string;
  description: string;
  status?: 'current' | 'normal';
};

type ProductCategory = 'food' | 'drink' | 'medicine' | 'skincare' | 'cosmetics' | 'daily_goods' | 'souvenir' | 'unknown';

type ProductUnderstandResult = {
  recognitionStatus: 'recognized' | 'uncertain' | 'unable_to_recognize';
  productName: string;
  originalName: string;
  category: ProductCategory;
  description: string;
  ingredients: string[];
  allergens: string[];
  warnings: string[];
  goodFor: string[];
  flavor: string;
  sugar: string;
  caffeine: string;
  alcohol: string;
  whatItIs: string;
  howToUse: string;
  whatItDoes: string;
  skinType: string;
  keyIngredients: string[];
  notes: string[];
  confidence: 'high' | 'medium' | 'low';
  needsManualCheck: boolean;
};

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[app:error-boundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <div className="phone-frame">
            <section className="screen">
              <div className="error-panel app-error-panel">
                <strong>Something went wrong.</strong>
                <p>Please go back home and try again.</p>
              </div>
              <button className="primary-button" type="button" onClick={() => window.location.assign('/')}>Back Home</button>
            </section>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

type ExchangeRatesResult = {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
};

type ShoppingPriceSession = {
  amount: string;
  toCurrency: string;
  hasChecked: boolean;
};

type TravelerQuestion = {
  privateToken: string;
  question: string;
  location: string;
  context: string;
  hasPhoto: boolean;
  status: 'new' | 'answered' | 'closed';
  createdAt: string;
  updatedAt: string;
  answeredAt: string;
  replyEnglish: string;
  usefulChinese: string;
};

type AdminQuestionSummary = {
  id: number;
  status: 'new' | 'answered' | 'closed';
  question: string;
  location: string;
  context: string;
  hasPhoto: boolean;
  emailStatus: 'pending' | 'sent' | 'failed' | 'development_logged' | 'not_configured';
  emailProvider?: string;
  emailProviderMessageId?: string;
  emailAttemptedAt?: string;
  emailRetryCount?: number;
  adminNotificationStatus: 'pending' | 'sent' | 'failed' | 'development_logged' | 'not_configured';
  createdAt: string;
  updatedAt: string;
};

type AdminQuestion = AdminQuestionSummary & {
  privateToken: string;
  email: string;
  replyEnglish: string;
  usefulChinese: string;
  answerStatus: 'draft' | 'published';
  emailStatus: 'pending' | 'sent' | 'failed' | 'development_logged' | 'not_configured';
  emailSentAt: string;
  emailError: string;
  emailProvider: string;
  emailProviderMessageId: string;
  emailAttemptedAt: string;
  emailRetryCount: number;
  adminNotificationStatus: 'pending' | 'sent' | 'failed' | 'development_logged' | 'not_configured';
  adminNotificationSentAt: string;
  adminNotificationError: string;
  adminNotificationProvider: string;
  adminNotificationProviderMessageId: string;
  adminNotificationAttemptedAt: string;
  adminNotificationRetryCount: number;
  answeredAt: string;
};

type AdminQuestionUpdateResponse = AdminQuestion | {
  question: AdminQuestion;
  emailDeliveryMessage?: string;
};

function upsertSavedAddress(items: SavedAddress[], address: SavedAddress) {
  const existing = items.find((item) => item.chineseAddress === address.chineseAddress);
  if (existing) {
    return items.map((item) => item.id === existing.id ? { ...item, ...address, id: existing.id } : item);
  }

  return [...items, address];
}

function HomeSketchIcon({ type }: { type: 'restaurant' | 'address' | 'rail' | 'quick' | 'shopping' | 'local' }) {
  return (
    <svg className="home-sketch-icon" viewBox="0 0 32 32" aria-hidden="true">
      {type === 'restaurant' && (
        <>
          <path d="M8.2 12.5c1.8-3.7 5.7-5.4 9.3-4.5 3.8.9 6.3 4.2 6.1 8.2" />
          <path d="M6.8 16.1c5.6 1.4 11.5 1.4 18.2 0" />
          <path d="M9.3 16.8c.5 4.2 3.1 6.9 7 6.9 3.8 0 6.4-2.6 7-6.9" />
          <path d="M13.4 9.7c-.4-1.2.2-2.1 1-2.7" />
        </>
      )}
      {type === 'address' && (
        <>
          <path d="M6.5 21.7c4.1-1.4 7-1.5 10.3-.3 2.8 1 5.6.9 8.7-.5" />
          <path d="M13.1 18.2c-2.2-2.5-3.4-4.6-3.4-6.5 0-3.3 2.5-5.4 5.6-5.4s5.5 2.2 5.5 5.3c0 2.1-1.5 4.4-4 7" />
          <path d="M15.3 10.2c1.1 0 1.9.8 1.9 1.8s-.8 1.8-1.9 1.8-1.9-.8-1.9-1.8.8-1.8 1.9-1.8z" />
        </>
      )}
      {type === 'rail' && (
        <>
          <path d="M7.7 10.2c4.1-.6 9.5-.8 16.4-.2" />
          <path d="M8.7 10.8l-.8 10.4c4.8.6 10.2.6 16.1-.2l-.9-10.4" />
          <path d="M11.3 14.5h3.9" />
          <path d="M18 14.5h3.5" />
          <path d="M11 18.3c3.8.4 7.2.3 10.6-.2" />
          <path d="M11.6 24.2l2-2.6" />
          <path d="M20.3 21.6l2.1 2.6" />
        </>
      )}
      {type === 'quick' && (
        <>
          <path d="M9.1 6.8c4.6-.5 8.9-.4 13.2.3l-.3 18c-4.1-.7-8.2-.8-12.5-.2z" />
          <path d="M13 11.2c1.9-.2 3.9-.1 6 .2" />
          <path d="M12.8 15.2c2.6-.2 4.8-.1 6.7.2" />
          <path d="M12.7 19.1c1.5-.2 3.2-.1 5 .1" />
        </>
      )}
      {type === 'shopping' && (
        <>
          <path d="M9.2 6.9c4.3-.5 8.6-.4 13 .3l-.5 17.9c-4-.5-8-.7-12.1-.2z" />
          <path d="M12.5 11.4c2.2-.2 4.4-.1 6.7.2" />
          <path d="M12.5 15.4c1.6-.2 3.3-.1 5 .1" />
          <path d="M12.4 20.1c1.9.3 3.8.3 5.8 0" />
          <path d="M20.8 11.2l2.4 2.6" />
        </>
      )}
      {type === 'local' && (
        <>
          <path d="M8.1 9.6c3.8-2.5 9.1-2.7 13-.6 3.3 1.8 4.5 5.3 2.7 8.3-1.9 3.2-6.6 4.5-11.2 3.4l-3.9 2.4 1.1-4.1c-2.8-2.4-3.5-6.5-1.7-9.4z" />
          <path d="M12.5 14.4c2.7-.4 5-.3 7 .2" />
          <path d="M13.1 17.2c1.6-.2 3-.2 4.4.1" />
        </>
      )}
    </svg>
  );
}

const scenarios: Scenario[] = [
  {
    id: 'restaurant',
    title: 'Restaurant',
    description: 'Understand menus and communicate with restaurant staff.',
    icon: <HomeSketchIcon type="restaurant" />,
    page: 'restaurant',
  },
  {
    id: 'taxi',
    title: 'Address Helper',
    description: 'Format addresses and reopen saved places.',
    icon: <HomeSketchIcon type="address" />,
    page: 'taxi',
  },
  {
    id: 'rail',
    title: 'High-speed Rail',
    description: 'Understand your ticket and get through the station.',
    icon: <HomeSketchIcon type="rail" />,
    page: 'rail',
  },
  {
    id: 'quick',
    title: 'Quick Phrases',
    description: 'Use basic phrases when a situation is unclear.',
    icon: <HomeSketchIcon type="quick" />,
    page: 'quick-phrases',
  },
  {
    id: 'shopping',
    title: 'Shopping',
    description: 'Convert prices and ask simple shopping questions.',
    icon: <ShoppingCart size={27} strokeWidth={2.25} aria-hidden="true" />,
    page: 'shopping',
  },
  {
    id: 'ask-local',
    title: 'Ask a Local',
    description: 'Submit a practical question for local help.',
    icon: <HomeSketchIcon type="local" />,
    page: 'ask-local',
  },
];

const restaurantTools: Tool[] = [
  { title: 'Understand Menu', description: 'Take a photo and understand the menu.', icon: <Camera size={24} aria-hidden="true" />, page: 'translate-menu' },
  { title: 'Explore a Dish', description: 'Learn what a dish is before you order.', icon: <BookOpen size={24} aria-hidden="true" />, page: 'explore-dish' },
  { title: 'Restaurant Phrases', description: 'Communicate clearly with restaurant staff.', icon: <MessageCircle size={24} aria-hidden="true" />, page: 'restaurant-phrases' },
];

const restaurantPhraseGroups: RestaurantPhraseGroup[] = [
  {
    id: 'ordering',
    title: 'Ordering',
    subtitle: 'When you are ready to choose.',
    phrases: [
      { id: 'restaurant-order-this', category: 'ordering', english: "I'd like to order this.", chinese: '我要点这个。', situation: 'I want the dish I am pointing at.' },
      { id: 'restaurant-recommend', category: 'ordering', english: 'Can you recommend one?', chinese: '你可以推荐一道菜吗？', situation: "I don't know what to choose." },
      { id: 'restaurant-thats-all', category: 'ordering', english: "That's all, thank you.", chinese: '就这些，谢谢。', situation: "I've finished ordering." },
    ],
  },
  {
    id: 'dietary',
    title: 'Dietary needs',
    subtitle: 'When ingredients matter.',
    phrases: [
      { id: 'restaurant-less-spicy', category: 'dietary', english: 'Less spicy, please.', chinese: '请少放一点辣。', situation: "I can't eat very spicy food." },
      { id: 'restaurant-no-cilantro', category: 'dietary', english: 'No cilantro, please.', chinese: '请不要放香菜。', situation: "I don't eat cilantro." },
      { id: 'restaurant-peanut-allergy', category: 'dietary', english: "I'm allergic to peanuts.", chinese: '我对花生过敏，请不要放花生。', situation: 'I have a peanut allergy.' },
      { id: 'restaurant-pork', category: 'dietary', english: 'Does this contain pork?', chinese: '这个里面有猪肉吗？', situation: 'I need to avoid pork.' },
      { id: 'restaurant-vegetarian', category: 'dietary', english: "I'm vegetarian.", chinese: '我是素食者，请问有素菜吗？', situation: 'I need a vegetarian option.' },
    ],
  },
  {
    id: 'payment',
    title: 'Payment',
    subtitle: 'When you are ready to leave.',
    phrases: [
      { id: 'restaurant-bill', category: 'payment', english: 'Could I have the bill?', chinese: '麻烦买单。', situation: 'I want to pay now.' },
      { id: 'restaurant-alipay', category: 'payment', english: 'Can I pay with Alipay?', chinese: '可以用支付宝吗？', situation: 'I want to pay with Alipay.' },
      { id: 'restaurant-card', category: 'payment', english: 'Can I pay by card?', chinese: '可以刷卡吗？', situation: 'I want to use a bank card.' },
    ],
  },
  {
    id: 'takeaway',
    title: 'Take away',
    subtitle: 'When you want to bring food with you.',
    phrases: [
      { id: 'restaurant-pack', category: 'takeaway', english: 'Can I take this away?', chinese: '可以帮我打包吗？', situation: 'I want to pack the leftovers.' },
    ],
  },
];

const taxiTools: Tool[] = [
  { title: 'Translate an Address', description: 'Turn a Chinese or English address into a clear bilingual address card.', icon: <MapPin size={24} aria-hidden="true" />, page: 'taxi-destination' },
  { title: 'Saved Addresses', description: 'Quickly reopen your hotel, station, airport, or other saved places.', icon: <Landmark size={24} aria-hidden="true" />, page: 'saved-addresses' },
];

const railTools: Tool[] = [
  { title: 'Understand My Ticket', description: 'Upload a ticket screenshot and see the key details.', icon: <ReceiptText size={24} aria-hidden="true" />, page: 'rail-ticket', badge: 'AI' },
  { title: 'Boarding Steps', description: 'Know what to do at the station.', icon: <TrainFront size={24} aria-hidden="true" />, page: 'rail-boarding-steps' },
  { title: 'Railway Phrases', description: 'Show a few useful phrases to station staff.', icon: <MessageCircle size={24} aria-hidden="true" />, page: 'rail-phrases' },
];

const shoppingTools: Tool[] = [
  { title: 'Understand a Product', description: 'I found something interesting. What is it?', icon: <ShoppingBag size={24} aria-hidden="true" />, page: 'understand-product' },
  { title: 'Check a Price', description: "Know what you'll pay.", icon: <ShoppingCart size={24} aria-hidden="true" />, page: 'currency-converter' },
  { title: 'Shopping Phrases', description: 'Ask shop staff clearly.', icon: <MessageCircle size={24} aria-hidden="true" />, page: 'shopping-phrases' },
];

const emergencyServices: EmergencyService[] = [
  {
    id: 'police',
    name: 'Police',
    number: '110',
    description: 'For immediate danger, theft, assault, or urgent police help.',
    chinese: '请帮我报警。',
    icon: <Phone size={24} aria-hidden="true" />,
  },
  {
    id: 'ambulance',
    name: 'Ambulance',
    number: '120',
    description: 'For serious illness, injury, or a medical emergency.',
    chinese: '请帮我叫救护车。',
    icon: <AlertTriangle size={24} aria-hidden="true" />,
  },
  {
    id: 'fire',
    name: 'Fire',
    number: '119',
    description: 'For fire, smoke, or immediate fire danger.',
    chinese: '这里发生了火灾，请帮忙拨打119。',
    icon: <AlertTriangle size={24} aria-hidden="true" />,
  },
];

const railIssueContent: Record<string, { title: string; steps: string[]; phrase: Phrase }> = {
  missed: {
    title: 'I missed my train',
    steps: ['Go to the ticket office or service desk.', 'Show your passport and ticket.', 'Ask whether you can change to the next train.'],
    phrase: { id: 'rail-missed-card', category: 'rail', english: 'I missed my train. I need help changing my ticket.', chinese: '???????????????' },
  },
  change: {
    title: 'I need to change my ticket',
    steps: ['Go to the ticket office or service desk.', 'Show your passport and ticket.', 'Ask what trains are available.'],
    phrase: { id: 'rail-change-card', category: 'rail', english: 'I need to change my ticket.', chinese: '??????' },
  },
  delayed: {
    title: 'My train is delayed',
    steps: ['Check the station screen.', 'Stay near your boarding gate.', 'Ask staff if the gate changes.'],
    phrase: { id: 'rail-delay-card', category: 'rail', english: 'Is this train delayed?', chinese: '????????' },
  },
  wrongStation: {
    title: 'I went to the wrong station',
    steps: ['Do not enter the gate if you are unsure.', 'Ask staff to confirm your ticket station.', 'Go to the correct station as soon as possible.'],
    phrase: { id: 'rail-wrong-station-card', category: 'rail', english: 'Did I come to the wrong station?', chinese: '??????????' },
  },
};

function getStoredAskLocalSubmission() {
  try {
    const stored = window.sessionStorage.getItem(askLocalSubmittedStorageKey);
    if (!stored) return { token: '', email: '' };
    const parsed = JSON.parse(stored) as { token?: string; email?: string };
    return { token: parsed.token ?? '', email: parsed.email ?? '' };
  } catch {
    return { token: '', email: '' };
  }
}

function App() {
  const initialRoute = getRouteFromLocation();
  const [page, setPage] = useState<Page>(initialRoute.page);
  const [displayContext, setDisplayContext] = useState<DisplayContext | null>(null);
  const [dishQuery, setDishQuery] = useState('');
  const [selectedMenuDish, setSelectedMenuDish] = useState<TranslatedMenuItem | null>(null);
  const [selectedExploreDish, setSelectedExploreDish] = useState<DishExploreResult | null>(null);
  const [dishDetailSource, setDishDetailSource] = useState<'menu-result' | 'explore-dish'>('menu-result');
  const [selectedDishExample, setSelectedDishExample] = useState('');
  const [restaurantPhrasesScrollTop, setRestaurantPhrasesScrollTop] = useState(0);
  const [shoppingPhrasesScrollTop, setShoppingPhrasesScrollTop] = useState(0);
  const [quickPhrasesScrollTop, setQuickPhrasesScrollTop] = useState(0);
  const [shoppingPriceSession, setShoppingPriceSession] = useState<ShoppingPriceSession>({
    amount: '39.9',
    toCurrency: 'USD',
    hasChecked: false,
  });
  const [railTicketSession, setRailTicketSession] = useState<RailTicketSession>({
    ...emptyRailTicketSession,
  });
  const [railPhrasesScrollTop, setRailPhrasesScrollTop] = useState(0);
  const [menuSession, setMenuSession] = useState<RestaurantMenuSession>({
    selectedFile: null,
    previewUrl: '',
    result: null,
    selectedDishId: '',
    scrollTop: 0,
  });
  const [driverCardSource, setDriverCardSource] = useState<DriverCardSource>('saved-addresses');
  const [addressSession, setAddressSession] = useState<AddressHelperSession>({
    input: '',
    city: '',
    district: '',
    landmark: '',
    result: null,
    warningResult: null,
    selectedSavedAddressId: '',
    savedScrollTop: 0,
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedRailIssue, setSelectedRailIssue] = useState('missed');
  const [questionToken, setQuestionToken] = useState(initialRoute.token ?? getStoredAskLocalSubmission().token);
  const [askLocalSubmittedEmail, setAskLocalSubmittedEmail] = useState(getStoredAskLocalSubmission().email);
  const [adminQuestionId, setAdminQuestionId] = useState(initialRoute.adminQuestionId ?? 0);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(savedAddressesStorageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as SavedAddress[];
      if (Array.isArray(parsed)) {
        setSavedAddresses(parsed.filter((item) => item?.id && item?.chineseAddress));
      }
    } catch {
      setSavedAddresses([]);
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(savedAddressesStorageKey, JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  function openDisplay(phrase: Phrase, returnPage: Page, audience: DisplayContext['audience'], labels?: Partial<DisplayContext>) {
    setDisplayContext({
      phrase,
      returnPage,
      audience,
      showLabel: labels?.showLabel,
      copyLabel: labels?.copyLabel,
    });
    setPage('display-card');
  }

  React.useEffect(() => {
    window.history.replaceState(
      { page: initialRoute.page, token: initialRoute.token, adminQuestionId: initialRoute.adminQuestionId },
      '',
      getPathForRoute(initialRoute.page, initialRoute),
    );

    function handlePopState(event: PopStateEvent) {
      const route = event.state?.page ? event.state : getRouteFromLocation();
      const nextPage = route?.page;
      if (typeof nextPage === 'string') {
        setPage(nextPage as Page);
        setQuestionToken(typeof route.token === 'string' ? route.token : '');
        setAdminQuestionId(typeof route.adminQuestionId === 'number' ? route.adminQuestionId : 0);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(nextPage: Page, options?: { replace?: boolean; token?: string; adminQuestionId?: number }) {
    setPage(nextPage);
    if (options?.token !== undefined) setQuestionToken(options.token);
    if (options?.adminQuestionId !== undefined) setAdminQuestionId(options.adminQuestionId);
    const state = { page: nextPage, token: options?.token, adminQuestionId: options?.adminQuestionId };
    const path = getPathForRoute(nextPage, options);
    if (options?.replace) {
      window.history.replaceState(state, '', path);
    } else {
      window.history.pushState(state, '', path);
    }
  }

  function goHome() {
    setDisplayContext(null);
    navigate('home');
  }

  const showEmergencyButton = page === 'home';
  const selectedSavedAddress = savedAddresses.find((item) => item.id === addressSession.selectedSavedAddressId) ?? null;
  const activeAddressResult = driverCardSource === 'saved-addresses'
    ? selectedSavedAddress?.result ?? null
    : addressSession.result;
  const activeAddressText = driverCardSource === 'saved-addresses'
    ? selectedSavedAddress?.chineseAddress ?? ''
    : addressSession.result?.driverCard.destinationChinese || addressSession.result?.chineseAddress || addressSession.input;

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {page === 'home' && <HomePage onNavigate={navigate} />}

        {page === 'restaurant' && <RestaurantLandingPage onBack={goHome} onNavigate={navigate} />}
        {page === 'translate-menu' && (
          <TranslateMenuPage
            menuSession={menuSession}
            onBack={() => navigate('restaurant')}
            onDishSelect={(dish, scrollTop) => {
              setMenuSession((session) => ({ ...session, selectedDishId: dish.id, scrollTop }));
              setSelectedMenuDish(dish);
              setSelectedExploreDish(null);
              setDishDetailSource('menu-result');
              navigate('menu-dish-detail');
            }}
            onSessionChange={setMenuSession}
          />
        )}
        {page === 'menu-dish-detail' && (selectedMenuDish || selectedExploreDish) && (
          <MenuDishDetailPage
            item={dishDetailSource === 'menu-result' ? selectedMenuDish : null}
            exploreResult={dishDetailSource === 'explore-dish' ? selectedExploreDish : null}
            onBack={() => navigate(dishDetailSource === 'explore-dish' ? 'explore-dish' : 'translate-menu')}
          />
        )}
        {page === 'restaurant-phrases' && (
          <RestaurantPhrasesPage
            groups={restaurantPhraseGroups}
            scrollTop={restaurantPhrasesScrollTop}
            onBack={() => navigate('restaurant')}
            onScrollChange={setRestaurantPhrasesScrollTop}
            onSelect={(phrase, scrollTop) => {
              setRestaurantPhrasesScrollTop(scrollTop);
              openDisplay(phrase, 'restaurant-phrases', 'Staff', { showLabel: 'Show Full Screen' });
            }}
          />
        )}
        {page === 'explore-dish' && (
          <ExploreDishAiPage
            dishQuery={dishQuery}
            selectedExample={selectedDishExample}
            onBack={() => navigate('restaurant')}
            onChange={setDishQuery}
            onExampleChange={setSelectedDishExample}
            onResult={(result) => {
              setSelectedExploreDish(result);
              setSelectedMenuDish(null);
              setDishDetailSource('explore-dish');
              navigate('menu-dish-detail');
            }}
          />
        )}

        {page === 'taxi' && <AddressHelperLandingPage onBack={goHome} onNavigate={navigate} />}
        {page === 'taxi-destination' && (
          <TaxiDestinationPage
            session={addressSession}
            onSessionChange={setAddressSession}
            onBack={() => navigate('taxi')}
            onFormatted={(result) => {
              setAddressSession((session) => ({ ...session, input: result.originalInput, result, warningResult: null }));
              setDriverCardSource('taxi-destination');
              navigate('driver-card');
            }}
          />
        )}
        {page === 'driver-card' && (
          <DriverCard
            address={activeAddressText}
            result={activeAddressResult}
            savedAddress={selectedSavedAddress}
            source={driverCardSource}
            onBack={() => navigate(driverCardSource, { replace: true })}
            onEdit={() => navigate('taxi-destination')}
            onSaveAddress={(address) => setSavedAddresses((items) => upsertSavedAddress(items, address))}
            onRenameAddress={(address) => setSavedAddresses((items) => items.map((item) => item.id === address.id ? address : item))}
            onDeleteAddress={(id) => {
              setSavedAddresses((items) => items.filter((item) => item.id !== id));
              setAddressSession((session) => ({ ...session, selectedSavedAddressId: '' }));
              navigate('saved-addresses', { replace: true });
            }}
            onSetDestination={() => {
              const address = selectedSavedAddress;
              if (!address) return;
              setAddressSession((session) => ({
                ...session,
                input: address.chineseAddress,
                result: address.result ?? null,
                warningResult: null,
              }));
              setDriverCardSource('taxi-destination');
              navigate(address.result ? 'driver-card' : 'taxi-destination');
            }}
            onDone={() => navigate('taxi')}
            onStartOver={() => {
              setAddressSession({
                input: '',
                city: '',
                district: '',
                landmark: '',
                result: null,
                warningResult: null,
                selectedSavedAddressId: '',
                savedScrollTop: addressSession.savedScrollTop,
              });
              setDriverCardSource('taxi-destination');
              navigate('taxi-destination');
            }}
          />
        )}
        {page === 'saved-addresses' && (
          <SavedAddressesPage
            addresses={savedAddresses}
            scrollTop={addressSession.savedScrollTop}
            onBack={() => navigate('taxi')}
            onAdd={() => navigate('add-address')}
            onTranslate={() => navigate('taxi-destination')}
            onScrollChange={(scrollTop) => setAddressSession((session) => ({ ...session, savedScrollTop: scrollTop }))}
            onUse={(address) => {
              setAddressSession((session) => ({
                ...session,
                selectedSavedAddressId: address.id,
                savedScrollTop: session.savedScrollTop,
              }));
              setSavedAddresses((items) => items.map((item) => item.id === address.id ? { ...item, lastUsedAt: new Date().toISOString() } : item));
              setDriverCardSource('saved-addresses');
              navigate('driver-card');
            }}
            onRename={(address) => setSavedAddresses((items) => items.map((item) => item.id === address.id ? address : item))}
            onDelete={(id) => setSavedAddresses((items) => items.filter((item) => item.id !== id))}
          />
        )}
        {page === 'add-address' && <AddAddressPage onBack={() => navigate('saved-addresses')} onSave={(address) => { setSavedAddresses((items) => upsertSavedAddress(items, address)); navigate('saved-addresses'); }} />}

        {page === 'rail' && <RailLandingPage onBack={goHome} onNavigate={navigate} />}
        {page === 'rail-ticket' && (
          <RailTicketAiPage
            session={normalizeRailTicketSession(railTicketSession)}
            onSessionChange={setRailTicketSession}
            onBack={() => navigate('rail')}
          />
        )}
        {page === 'rail-boarding-steps' && <BoardingBasicsPage onBack={() => navigate('rail')} />}
        {page === 'rail-before-station' && <StepTaskPage title="Before Going to the Station" description="Quick check before leaving." steps={['Bring your passport.', 'Confirm the correct departure station.', 'Check train number and departure time.', 'Arrive early enough for security and boarding.']} onBack={() => navigate('rail')} />}
        {page === 'rail-station-gate' && (
          <StepTaskPage title="Find My Station and Gate" description="At the station" steps={['Confirm the correct station.', 'Enter with passport.', 'Check the departure board.', 'Find the boarding gate.', 'Wait for boarding.']} onBack={() => navigate('rail')} phrase={{ label: 'Ask for gate help', phrase: railPhrases[0] }} onPhrase={(phrase) => openDisplay(phrase, 'rail-station-gate', 'Local Person')} />
        )}
        {page === 'rail-boarding-seat' && (
          <StepTaskPage title="Boarding and Seat" description="On the train" steps={['Check carriage number.', 'Find seat number.', 'Store luggage.', 'Confirm destination.']} onBack={() => navigate('rail')} phrase={{ label: 'Ask for seat help', phrase: railPhrases[2] }} onPhrase={(phrase) => openDisplay(phrase, 'rail-boarding-seat', 'Local Person')} />
        )}
        {page === 'rail-issue' && <RailIssuePage onBack={() => navigate('rail')} onChoose={(issue) => { setSelectedRailIssue(issue); navigate('rail-issue-result'); }} />}
        {page === 'rail-issue-result' && <RailIssueResultPage issue={railIssueContent[selectedRailIssue]} onBack={() => navigate('rail-issue')} onShow={(phrase) => openDisplay(phrase, 'rail-issue-result', 'Local Person')} />}
        {page === 'rail-phrases' && (
          <RestaurantPhrasesPage
            label="High-speed Rail"
            title="Railway Phrases"
            subtitle="I need to ask station staff something."
            groups={getRailPhraseGroups(normalizeRailTicketSession(railTicketSession).result)}
            scrollTop={railPhrasesScrollTop}
            onBack={() => navigate('rail')}
            onScrollChange={setRailPhrasesScrollTop}
            onSelect={(phrase, scrollTop) => {
              setRailPhrasesScrollTop(scrollTop);
              openDisplay(phrase, 'rail-phrases', 'Staff', { showLabel: 'Show Full Screen' });
            }}
          />
        )}

        {page === 'shopping' && <ShoppingLandingPage onBack={goHome} onNavigate={navigate} />}
        {page === 'understand-product' && <UnderstandProductPage onBack={() => navigate('shopping')} />}
        {page === 'currency-converter' && <LiveCurrencyConverterPage session={shoppingPriceSession} onSessionChange={setShoppingPriceSession} onBack={() => navigate('shopping')} />}
        {page === 'shopping-phrases' && (
          <RestaurantPhrasesPage
            label="Shopping"
            title="Shopping Phrases"
            subtitle="I need to ask the shop assistant something."
            groups={shoppingPhraseGroups}
            scrollTop={shoppingPhrasesScrollTop}
            onBack={() => navigate('shopping')}
            onScrollChange={setShoppingPhrasesScrollTop}
            onSelect={(phrase, scrollTop) => {
              setShoppingPhrasesScrollTop(scrollTop);
              openDisplay(phrase, 'shopping-phrases', 'Shop Staff', { showLabel: 'Show Full Screen' });
            }}
          />
        )}

        {page === 'emergency' && (
          <EmergencyPage
            onBack={goHome}
            onAskLocal={() => navigate('ask-local')}
            onShowChinese={(service) => {
              openDisplay(
                {
                  id: `emergency-${service.id}`,
                  category: 'emergency',
                  english: service.name,
                  chinese: service.chinese,
                },
                'emergency',
                'Local Person',
                { showLabel: 'Show Full Screen', copyLabel: 'Copy Chinese' },
              );
            }}
          />
        )}

        {page === 'quick-phrases' && (
          <QuickPhrasesPage
            groups={quickPhraseGroups}
            scrollTop={quickPhrasesScrollTop}
            onBack={goHome}
            onScrollChange={setQuickPhrasesScrollTop}
            onSelect={(phrase, scrollTop) => {
              setQuickPhrasesScrollTop(scrollTop);
              openDisplay(phrase, 'quick-phrases', 'Local Person', { showLabel: 'Show Full Screen' });
            }}
          />
        )}

        {page === 'ask-local' && (
          <AskLocalPage
            onBack={goHome}
            onEmergency={() => navigate('emergency')}
            onCreated={(token, email) => {
              setQuestionToken(token);
              setAskLocalSubmittedEmail(email);
              navigate('ask-local-submitted', { token });
            }}
          />
        )}
        {page === 'ask-local-submitted' && (
          <SubmittedPage
            email={askLocalSubmittedEmail}
            privateToken={questionToken}
            onBack={() => navigate('ask-local')}
            onHome={goHome}
            onOpenPrivateLink={() => navigate('question-detail', { token: questionToken })}
          />
        )}
        {page === 'question-detail' && <QuestionDetailPage token={questionToken} onHome={goHome} />}
        {page === 'admin-login' && <AdminLoginPage onLoggedIn={() => navigate('admin-questions')} onHome={goHome} />}
        {page === 'admin-questions' && <AdminQuestionsPage onHome={goHome} onOpen={(id) => navigate('admin-question-detail', { adminQuestionId: id })} onLogin={() => navigate('admin-login', { replace: true })} />}
        {page === 'admin-question-detail' && <AdminQuestionDetailPage id={adminQuestionId} onBack={() => navigate('admin-questions')} onLogin={() => navigate('admin-login', { replace: true })} />}
        {page === 'design-system' && <DesignSystemPreview onBack={goHome} />}

        {page === 'display-card' && displayContext && <ChineseDisplayCard context={displayContext} onBack={() => navigate(displayContext.returnPage)} />}

        {showEmergencyButton ? (
          <button className="floating-emergency" type="button" onClick={() => navigate('emergency')} aria-label="Emergency">
            <AlertTriangle size={21} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </main>
  );
}

function getRouteFromLocation(): { page: Page; token?: string; adminQuestionId?: number } {
  const path = window.location.pathname;
  const questionMatch = path.match(/^\/questions\/([A-Za-z0-9_-]+)$/);
  if (questionMatch) return { page: 'question-detail', token: questionMatch[1] };

  const adminQuestionMatch = path.match(/^\/admin\/questions\/(\d+)$/);
  if (adminQuestionMatch) return { page: 'admin-question-detail', adminQuestionId: Number(adminQuestionMatch[1]) };

  if (path === '/admin/login') return { page: 'admin-login' };
  if (path === '/admin/questions') return { page: 'admin-questions' };
  if (path === '/ask-local') return { page: 'ask-local' };
  if (path === '/ask-local/sent') return { page: 'ask-local-submitted' };
  if (path === '/emergency') return { page: 'emergency' };
  if (path === '/design-system') return { page: 'design-system' };
  return { page: 'home' };
}

function getPathForRoute(page: Page, options?: { token?: string; adminQuestionId?: number }) {
  if (page === 'question-detail') return `/questions/${options?.token ?? ''}`;
  if (page === 'admin-login') return '/admin/login';
  if (page === 'admin-questions') return '/admin/questions';
  if (page === 'admin-question-detail') return `/admin/questions/${options?.adminQuestionId ?? ''}`;
  if (page === 'ask-local') return '/ask-local';
  if (page === 'ask-local-submitted') return '/ask-local/sent';
  if (page === 'emergency') return '/emergency';
  if (page === 'design-system') return '/design-system';
  return '/';
}

function HomePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const restaurant = scenarios.find((scenario) => scenario.id === 'restaurant');
  const address = scenarios.find((scenario) => scenario.id === 'taxi');
  const askLocal = scenarios.find((scenario) => scenario.id === 'ask-local');
  const quick = scenarios.find((scenario) => scenario.id === 'quick');
  const rail = scenarios.find((scenario) => scenario.id === 'rail');
  const shopping = scenarios.find((scenario) => scenario.id === 'shopping');
  const homeHints: Record<string, string> = {
    restaurant: 'Menus & dishes',
    taxi: 'Address translation',
    quick: 'Daily phrases',
    'ask-local': 'Human help',
    rail: 'Boarding help',
    shopping: 'Currency converter',
  };

  return (
    <section className="screen home-screen home-refresh" aria-labelledby="home-title">
      <header className="home-header">
        <img
          className="home-brand-lockup"
          src="/brand/approved/orienta-brand-lockup-removebg.png"
          width="1536"
          height="1024"
          alt="Orienta - Travel in China with confidence"
          loading="eager"
          decoding="async"
        />
        <h1 id="home-title">Need a little help?</h1>
        <p className="home-intro">Choose what you need right now.</p>
      </header>

      <section className="home-main" aria-label="Travel tools">
        {restaurant ? (
          <button className="home-feature-card" type="button" onClick={() => onNavigate(restaurant.page)}>
            <span className="home-feature-copy">
              <strong>{restaurant.title}</strong>
              <span>{homeHints.restaurant}</span>
            </span>
            <span className="home-feature-icon">{restaurant.icon}</span>
          </button>
        ) : null}

        <div className="home-action-grid">
          {[address, rail, shopping, quick].filter(Boolean).map((scenario) => (
            <button className={`home-action-button home-action-${scenario!.id}`} key={scenario!.id} type="button" onClick={() => onNavigate(scenario!.page)}>
              <span className="home-action-icon">{scenario!.icon}</span>
              <strong>{scenario!.title}</strong>
              <small>{homeHints[scenario!.id]}</small>
            </button>
          ))}
        </div>

        {askLocal ? (
          <button className="home-support-row" type="button" onClick={() => onNavigate(askLocal.page)}>
            <span className="home-support-icon">{askLocal.icon}</span>
            <span>
              <strong>{askLocal.title}</strong>
              <small>{homeHints['ask-local']}</small>
            </span>
          </button>
        ) : null}
      </section>
    </section>
  );
}

function ScenarioList({ scenarios, onNavigate }: { scenarios: Scenario[]; onNavigate: (page: Page) => void }) {
  return (
    <section className="card-section" aria-label="Travel help">
      <div className="card-list">
        {scenarios.map((scenario) => (
          <button className={`scenario-card ${scenario.id === 'emergency' ? 'emergency-entry' : ''}`} key={scenario.id} type="button" onClick={() => onNavigate(scenario.page)}>
            <span className="scenario-icon">{scenario.icon}</span>
            <span><strong>{scenario.title}</strong><small>{scenario.description}</small></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PageHeader({ title, description, onBack }: { title: string; description?: string; onBack: () => void }) {
  return (
    <>
      <header className="top-bar">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
      </header>
      <div className="page-copy">{description ? <p className="eyebrow">{description}</p> : null}<h1>{title}</h1></div>
    </>
  );
}

function LandingLandscape() {
  return (
    <img
      className="landing-landscape"
      src="/brand/approved/orienta-bottom-landscape-transparent.png"
      width="1774"
      height="887"
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
    />
  );
}

function RestaurantLandingPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: Page) => void }) {
  const restaurantCards = [
    {
      title: 'Understand Menu',
      scenario: "Can't read the menu?",
      icon: <Camera size={27} strokeWidth={2.25} aria-hidden="true" />,
      page: 'translate-menu' as Page,
      className: 'restaurant-primary-card',
    },
    {
      title: 'Explore a Dish',
      scenario: 'What is Mapo Tofu?',
      icon: <BookOpen size={25} strokeWidth={2.25} aria-hidden="true" />,
      page: 'explore-dish' as Page,
      className: 'restaurant-dish-card',
    },
    {
      title: 'Restaurant Phrases',
      scenario: 'Less spicy food?',
      icon: <MessageCircle size={25} strokeWidth={2.25} aria-hidden="true" />,
      page: 'restaurant-phrases' as Page,
      className: 'restaurant-phrase-card',
    },
  ];

  const [primaryCard, ...secondaryCards] = restaurantCards;

  return (
    <section className="screen restaurant-landing-screen" aria-labelledby="restaurant-title">
      <header className="restaurant-landing-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Restaurant</p>
        <h1 id="restaurant-title">What do you need help with?</h1>
        <span>Pick the situation that matches right now.</span>
      </header>

      <section className="restaurant-landing-cards" aria-label="Restaurant help">
        <button className={`restaurant-landing-card ${primaryCard.className}`} type="button" onClick={() => onNavigate(primaryCard.page)}>
          <span className="restaurant-card-copy">
            <strong>{primaryCard.title}</strong>
            <small>{primaryCard.scenario}</small>
          </span>
          <span className="restaurant-card-icon">{primaryCard.icon}</span>
        </button>

        <div className="restaurant-secondary-grid">
          {secondaryCards.map((card) => (
            <button className={`restaurant-landing-card restaurant-secondary-card ${card.className}`} type="button" key={card.title} onClick={() => onNavigate(card.page)}>
              <span className="restaurant-card-icon">{card.icon}</span>
              <span className="restaurant-card-copy">
                <strong>{card.title}</strong>
                <small>{card.scenario}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
      <LandingLandscape />
    </section>
  );
}

function ShoppingLandingPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: Page) => void }) {
  const [primaryCard, ...secondaryCards] = shoppingTools;

  return (
    <section className="screen restaurant-landing-screen shopping-landing-screen" aria-labelledby="shopping-title">
      <header className="restaurant-landing-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Shopping</p>
        <h1 id="shopping-title">What are you buying?</h1>
        <span>Understand products, prices, and shop conversations.</span>
      </header>

      <section className="restaurant-landing-cards" aria-label="Shopping help">
        <button className="restaurant-landing-card restaurant-primary-card shopping-primary-card" type="button" onClick={() => onNavigate(primaryCard.page)}>
          <span className="restaurant-card-copy">
            <strong>{primaryCard.title}</strong>
            <small>{primaryCard.description}</small>
          </span>
          <span className="restaurant-card-icon">{primaryCard.icon}</span>
        </button>

        <div className="restaurant-secondary-grid">
          {secondaryCards.map((card, index) => (
            <button
              className={`restaurant-landing-card restaurant-secondary-card ${index === 0 ? 'shopping-price-card' : 'shopping-phrase-card'}`}
              type="button"
              key={card.title}
              onClick={() => onNavigate(card.page)}
            >
              <span className="restaurant-card-icon">{card.icon}</span>
              <span className="restaurant-card-copy">
                <strong>{card.title}</strong>
                <small>{card.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
      <LandingLandscape />
    </section>
  );
}

function AddressHelperLandingPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: Page) => void }) {
  return (
    <section className="screen restaurant-landing-screen address-helper-screen" aria-labelledby="address-helper-title">
      <header className="restaurant-landing-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Address Helper</p>
        <h1 id="address-helper-title">Where do you need to go?</h1>
        <span>Turn any address into something easy to show.</span>
      </header>

      <section className="restaurant-landing-cards" aria-label="Address help">
        <button className="restaurant-landing-card restaurant-primary-card address-primary-card" type="button" onClick={() => onNavigate('taxi-destination')}>
          <span className="restaurant-card-copy">
            <strong>Translate an Address</strong>
            <small>I have an address, but I'm not sure it's clear.</small>
          </span>
          <span className="restaurant-card-icon"><MapPin size={27} strokeWidth={2.25} aria-hidden="true" /></span>
        </button>

        <button className="restaurant-landing-card address-saved-card" type="button" onClick={() => onNavigate('saved-addresses')}>
          <span className="restaurant-card-icon"><Landmark size={25} strokeWidth={2.25} aria-hidden="true" /></span>
          <span className="restaurant-card-copy">
            <strong>Saved Addresses</strong>
            <small>I want to show my hotel or station again.</small>
          </span>
        </button>
      </section>
      <LandingLandscape />
    </section>
  );
}

function RailLandingPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (page: Page) => void }) {
  return (
    <section className="screen restaurant-landing-screen rail-landing-screen" aria-labelledby="rail-title">
      <header className="restaurant-landing-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>High-speed Rail</p>
        <h1 id="rail-title">Know your next step.</h1>
        <span>Understand your ticket and move through the station with confidence.</span>
      </header>

      <section className="restaurant-landing-cards" aria-label="High-speed rail help">
        <button className="restaurant-landing-card restaurant-primary-card rail-primary-card" type="button" onClick={() => onNavigate('rail-ticket')}>
          <span className="restaurant-card-copy">
            <strong>Understand My Ticket</strong>
            <small>Understand your ticket and next steps.</small>
          </span>
          <span className="restaurant-card-icon"><ReceiptText size={27} strokeWidth={2.25} aria-hidden="true" /></span>
        </button>

        <button className="restaurant-landing-card restaurant-secondary-card rail-phrase-card rail-wide-card" type="button" onClick={() => onNavigate('rail-phrases')}>
          <span className="restaurant-card-icon"><MessageCircle size={25} strokeWidth={2.25} aria-hidden="true" /></span>
          <span className="restaurant-card-copy">
            <strong>Railway Phrases</strong>
            <small>Ask station staff clearly.</small>
          </span>
        </button>
      </section>
      <LandingLandscape />
    </section>
  );
}

function HubPage({ title, description, tools, onBack, onNavigate }: { title: string; description: string; tools: Tool[]; onBack: () => void; onNavigate: (page: Page) => void }) {
  return (
    <section className="screen">
      <PageHeader title={title} description={description} onBack={onBack} />
      <ToolList tools={tools} onNavigate={onNavigate} />
    </section>
  );
}

function ToolList({ tools, onNavigate }: { tools: Tool[]; onNavigate: (page: Page) => void }) {
  return (
    <div className="card-list tool-list">
      {tools.map((tool) => (
        <button className="scenario-card" key={tool.title} type="button" onClick={() => onNavigate(tool.page)}>
          <span className="scenario-icon">{tool.icon}</span>
          <span><strong>{tool.title}{tool.badge ? <em>{tool.badge}</em> : null}</strong><small>{tool.description}</small></span>
        </button>
      ))}
    </div>
  );
}

function TranslateMenuPage({
  menuSession,
  onBack,
  onDishSelect,
  onSessionChange,
}: {
  menuSession: RestaurantMenuSession;
  onBack: () => void;
  onDishSelect: (dish: TranslatedMenuItem, scrollTop: number) => void;
  onSessionChange: React.Dispatch<React.SetStateAction<RestaurantMenuSession>>;
}) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const screenRef = React.useRef<HTMLElement | null>(null);
  const maxImageBytes = 8 * 1024 * 1024;
  const { selectedFile, previewUrl, result } = menuSession;

  React.useEffect(() => {
    if (!menuSession.result || !screenRef.current) return;
    window.requestAnimationFrame(() => {
      if (screenRef.current) {
        screenRef.current.scrollTop = menuSession.scrollTop;
      }
    });
  }, [menuSession.result, menuSession.scrollTop]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setError('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPEG, PNG, or WebP menu photo.');
      return;
    }

    try {
      const image = await compressMenuImage(file);

      if (image.size > maxImageBytes) {
      setError('Please choose a menu photo smaller than 8 MB.');
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      onSessionChange({
        selectedFile: image,
        previewUrl: URL.createObjectURL(image),
        result: null,
        selectedDishId: '',
        scrollTop: 0,
      });
    } catch {
      setError('We could not open this photo. Please try another menu image.');
    }
  }

  function removeImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    onSessionChange({
      selectedFile: null,
      previewUrl: '',
      result: null,
      selectedDishId: '',
      scrollTop: 0,
    });
    setError('');
  }

  async function translateMenu() {
    if (!selectedFile || isLoading) {
      return;
    }

    setIsLoading(true);
    setError('');

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 55_000);

    try {
      const formData = new FormData();
      formData.append('menu_image', selectedFile);

      const response = await fetch('/api/translate-menu', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('We could not read this menu clearly. Try taking the photo closer and flatter.');
      }

      const body = await response.json().catch(() => null);

      if (!body) {
        throw new Error('We could not read this menu clearly. Try taking the photo closer and flatter.');
      }

      onSessionChange((session) => ({
        ...session,
        result: body as TranslatedMenuResult,
        selectedDishId: '',
        scrollTop: 0,
      }));
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === 'AbortError'
          ? 'Understanding this menu took too long. Please try again with a clearer photo.'
          : requestError instanceof Error
            ? requestError.message
            : 'We could not read this menu clearly. Try taking the photo closer and flatter.',
      );
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  return (
    <section className="screen understand-menu-screen" ref={screenRef}>
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Restaurant</p>
        <h1>Understand Menu</h1>
        <span>The menu is all in Chinese. Take one clear photo and Orienta will help you decide what to order.</span>
      </header>

      <section className={`menu-photo-card ${previewUrl ? 'has-menu-photo' : ''}`} aria-label="Menu photo">
        {previewUrl ? (
          <>
            <div className="menu-photo-preview">
              <img src={previewUrl} alt="Selected menu" />
            </div>
            <div className="menu-photo-actions" aria-label="Change selected photo">
              <label className={`menu-small-action file-button ${isLoading ? 'disabled-button' : ''}`}>
                Retake
                <input accept="image/jpeg,image/png,image/webp" capture="environment" disabled={isLoading} type="file" onChange={handleFileChange} />
              </label>
              <label className={`menu-small-action file-button ${isLoading ? 'disabled-button' : ''}`}>
                Change
                <input accept="image/jpeg,image/png,image/webp" disabled={isLoading} type="file" onChange={handleFileChange} />
              </label>
              <button className="menu-small-action" type="button" disabled={isLoading} onClick={removeImage}>Delete</button>
            </div>
          </>
        ) : (
          <div className="menu-photo-empty">
            <span className="menu-photo-icon"><Camera size={31} strokeWidth={2.25} aria-hidden="true" /></span>
            <strong>I can't read this menu.</strong>
            <small>Take a flat, close photo with the dish names visible.</small>
          </div>
        )}
      </section>

      {!previewUrl ? (
        <div className="menu-upload-actions">
          <label className={`menu-upload-button menu-upload-primary file-button ${isLoading ? 'disabled-button' : ''}`}>
            <Camera size={20} strokeWidth={2.25} aria-hidden="true" />
            Take a Photo
            <input accept="image/jpeg,image/png,image/webp" capture="environment" disabled={isLoading} type="file" onChange={handleFileChange} />
          </label>
          <label className={`menu-upload-button menu-upload-secondary file-button ${isLoading ? 'disabled-button' : ''}`}>
            <ReceiptText size={20} strokeWidth={2.25} aria-hidden="true" />
            Upload an Image
            <input accept="image/jpeg,image/png,image/webp" disabled={isLoading} type="file" onChange={handleFileChange} />
          </label>
        </div>
      ) : null}

      {selectedFile ? (
        <button className="menu-understand-button" type="button" disabled={isLoading} onClick={translateMenu}>
          {isLoading ? 'Understanding your menu...' : result || error ? 'Try Again' : 'Understand Menu'}
        </button>
      ) : null}

      {isLoading ? <div className="menu-loading menu-calm-loading"><div className="spinner" /><p>Understanding your menu...</p></div> : null}
      {error ? <div className="error-panel menu-error-panel"><strong>We couldn't read this menu clearly.</strong><p>{error}</p></div> : null}
      {result ? (
        <MenuTranslationResult
          result={result}
          selectedDishId={menuSession.selectedDishId}
          onDishSelect={(dish) => onDishSelect(dish, screenRef.current?.scrollTop ?? 0)}
        />
      ) : null}
    </section>
  );
}

function MenuTranslationResult({ result, selectedDishId, onDishSelect }: { result: TranslatedMenuResult; selectedDishId: string; onDishSelect: (dish: TranslatedMenuItem) => void }) {
  if (result.recognition_status === 'unable_to_recognize') {
    return (
      <div className="error-panel">
        <strong>Unable to read this menu</strong>
        <p>Please try a clearer photo with the menu text visible.</p>
      </div>
    );
  }

  return (
    <div className="menu-result">
      <div className="menu-result-header">
        <span className="badge">{result.recognition_status === 'uncertain' ? 'Please check with staff' : 'Menu understood'}</span>
        <h2>{result.restaurant_name || 'Menu'}</h2>
        <p>Pick a dish to learn more before you order.</p>
      </div>
      {result.sections.length === 0 ? <p className="plain-copy">No clear menu items were found. Try another photo.</p> : null}
      {result.sections.map((section) => (
        <section className="menu-section" key={section.id}>
          <h3>{formatMenuSectionTitle(section.title)}</h3>
          <div className="menu-item-list">
            {section.items.map((item) => <MenuItemCard item={item} key={item.id} selected={item.id === selectedDishId} onSelect={onDishSelect} />)}
          </div>
        </section>
      ))}
      <WarningCard text="Ingredients and allergen information may be incomplete. Confirm with restaurant staff." />
    </div>
  );
}

function formatMenuSectionTitle(title: string) {
  const normalizedTitle = title.trim().toLowerCase();
  if (!normalizedTitle || normalizedTitle === 'recommended food' || normalizedTitle === 'recommended dishes' || normalizedTitle === 'menu items' || normalizedTitle === 'visible menu items') {
    return 'Your menu';
  }

  return title;
}

function MenuItemCard({ item, selected, onSelect }: { item: TranslatedMenuItem; selected: boolean; onSelect: (dish: TranslatedMenuItem) => void }) {
  return (
    <button className={`menu-item-card ${selected ? 'selected-menu-item-card' : ''}`} type="button" onClick={() => onSelect(item)}>
      <div className="menu-item-topline">
        <div className="menu-item-name">
          <strong>{item.translated_name || item.original_name || 'Unclear item'}</strong>
          {item.original_name ? <span>{item.original_name}</span> : null}
        </div>
        {item.price ? <p className="menu-price">{item.price}</p> : null}
      </div>
      {item.description ? <p>{shortenMenuDescription(item.description)}</p> : null}
    </button>
  );
}

function shortenMenuDescription(description: string) {
  const cleanDescription = description.trim();
  if (cleanDescription.length <= 96) return cleanDescription;
  return `${cleanDescription.slice(0, 92).trim()}...`;
}

function MenuDishDetailPage({ item, exploreResult, onBack }: { item: TranslatedMenuItem | null; exploreResult?: DishExploreResult | null; onBack: () => void }) {
  const dishName = exploreResult?.englishName || item?.translated_name || item?.original_name || 'This dish';
  const chineseName = exploreResult?.chineseName || item?.original_name || item?.translated_name || '';
  const dishDescription = exploreResult?.shortDescription || item?.description || '';
  const orderPhrase = exploreResult?.orderingPhraseChinese || (chineseName ? `我要一份${chineseName}。` : '我要这个。');
  const orderEnglish = exploreResult?.orderingPhraseEnglish || (chineseName ? `I'd like one ${dishName}.` : 'I want this one.');

  async function copyChinese() {
    try {
      await navigator.clipboard.writeText(orderPhrase);
    } catch {
      // Clipboard availability varies by browser; visual feedback can be added later.
    }
  }

  return (
    <section className="screen understand-menu-screen menu-dish-detail-screen">
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Dish detail</p>
        <h1>{dishName}</h1>
        {chineseName ? <span className="menu-dish-chinese-name">{chineseName}</span> : null}
      </header>

      <article className="menu-dish-detail-card menu-dish-intro-card">
        {item?.price ? <p className="menu-dish-detail-price">{item.price}</p> : null}
        {dishDescription ? <p>{dishDescription}</p> : <p>Ask the restaurant staff to confirm what this dish is.</p>}
      </article>

      {exploreResult ? (
        <div className="menu-dish-mini-grid">
          <DishDetailMini title="Spice" body={exploreResult.spiceLevel} />
          <DishDetailMini title="Beginner" body={exploreResult.beginnerFriendly ? 'Friendly' : 'Maybe not'} />
        </div>
      ) : null}

      {exploreResult?.mainIngredients?.length ? <DishDetailTags title="Main ingredients" tags={exploreResult.mainIngredients} /> : null}
      {exploreResult?.flavorProfile?.length ? <DishDetailTags title="Flavor" tags={exploreResult.flavorProfile} /> : null}

      {exploreResult ? (
        <div className="menu-dish-info-list">
          <DishDetailInfo title="How it is served" body={exploreResult.howItIsServed} />
          <DishDetailInfo title="How to eat" body={exploreResult.howToEat} />
          <DishDetailInfo title="Good for one person or sharing" body={exploreResult.portionGuide} />
          {exploreResult.origin ? <DishDetailInfo title="Usually from" body={exploreResult.origin} /> : null}
        </div>
      ) : null}

      <article className="menu-order-card">
        <span>Show to staff</span>
        <strong>{orderPhrase}</strong>
        <small>{orderEnglish}</small>
      </article>

      <div className="menu-detail-actions">
        <button className="menu-upload-button menu-upload-secondary" type="button" onClick={copyChinese}>Copy Chinese</button>
      </div>

      <WarningCard text="Ingredients and allergen information may be incomplete. Confirm with restaurant staff." />
    </section>
  );
}

function DishDetailTags({ title, tags }: { title: string; tags: string[] }) {
  return (
    <div className="menu-dish-detail-card menu-dish-detail-tags">
      <strong>{title}</strong>
      <div>{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </div>
  );
}

function DishDetailMini({ title, body }: { title: string; body: string }) {
  return (
    <div className="menu-dish-mini-card">
      <span>{title}</span>
      <strong>{body}</strong>
    </div>
  );
}

function DishDetailInfo({ title, body }: { title: string; body: string }) {
  if (!body) return null;

  return (
    <div className="menu-dish-info-card">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}


async function compressMenuImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1600;
  const maxOriginalBytes = 1_200_000;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.size <= maxOriginalBytes && file.type === 'image/jpeg') {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.82);
  });

  if (!blob || (scale === 1 && blob.size >= file.size)) {
    return file;
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() });
}

function PhraseListPage({ title, onBack, phrases, categories, onSelect, showMostUsed, warning }: { title: string; onBack: () => void; phrases: Phrase[]; categories: CategoryLabel[]; onSelect: (phrase: Phrase) => void; showMostUsed?: boolean; warning?: string }) {
  const mostUsed = phrases.filter((phrase) => phrase.mostUsed);
  return (
    <section className="screen phrase-screen">
      <PageHeader title={title} onBack={onBack} />
      {warning ? <WarningCard text={warning} /> : null}
      <div className="phrase-groups">
        {showMostUsed && mostUsed.length > 0 ? (
          <section className="phrase-group most-used-group" aria-label="Most Used">
            <h2>Most Used</h2>
            <div className="phrase-list">{mostUsed.map((phrase) => <PhraseButton phrase={phrase} key={phrase.id} onSelect={onSelect} featured />)}</div>
          </section>
        ) : null}
        {categories.map((category) => {
          const categoryPhrases = phrases.filter((phrase) => phrase.category === category.id);
          if (categoryPhrases.length === 0) return null;
          return (
            <section className="phrase-group" key={category.id} aria-label={category.label}>
              <h2>{category.label}</h2>
              <div className="phrase-list">{categoryPhrases.map((phrase) => <PhraseButton phrase={phrase} key={phrase.id} onSelect={onSelect} />)}</div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function PhraseButton({ phrase, onSelect, featured }: { phrase: Phrase; onSelect: (phrase: Phrase) => void; featured?: boolean }) {
  return (
    <button className={`phrase-option ${featured ? 'most-used-option' : ''}`} type="button" onClick={() => onSelect(phrase)}>
      <strong>{phrase.english}</strong><small>{phrase.chinese}</small>{phrase.notes ? <span>{phrase.notes}</span> : null}
    </button>
  );
}

function RestaurantPhrasesPage({
  label = 'Restaurant',
  title = 'Restaurant Phrases',
  subtitle = 'I need to say something to the staff.',
  groups,
  scrollTop,
  onBack,
  onScrollChange,
  onSelect,
}: {
  label?: string;
  title?: string;
  subtitle?: string;
  groups: RestaurantPhraseGroup[];
  scrollTop: number;
  onBack: () => void;
  onScrollChange: (scrollTop: number) => void;
  onSelect: (phrase: RestaurantPhrase, scrollTop: number) => void;
}) {
  const screenRef = React.useRef<HTMLElement | null>(null);
  const restoredScrollRef = React.useRef(false);

  React.useEffect(() => {
    if (restoredScrollRef.current) return;
    restoredScrollRef.current = true;
    window.requestAnimationFrame(() => {
      if (screenRef.current) {
        screenRef.current.scrollTop = scrollTop;
      }
    });
  }, []);

  return (
    <section className="screen understand-menu-screen restaurant-phrases-screen" ref={screenRef} onScroll={(event) => {
      const nextScrollTop = event.currentTarget.scrollTop;
      onScrollChange(nextScrollTop);
    }}>
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>{label}</p>
        <h1>{title}</h1>
        <span>{subtitle}</span>
      </header>

      <div className="restaurant-phrase-groups">
        {groups.map((group) => (
          <section className="restaurant-phrase-group" key={group.id}>
            <header>
              <h2>{group.title}</h2>
              <p>{group.subtitle}</p>
            </header>
            <div className="restaurant-phrase-list">
              {group.phrases.map((phrase) => (
                <button className="restaurant-phrase-card" type="button" key={phrase.id} onClick={() => onSelect(phrase, screenRef.current?.scrollTop ?? 0)}>
                  <strong>{phrase.english}</strong>
                  <small>{phrase.situation}</small>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function QuickPhrasesPage({
  groups,
  scrollTop,
  onBack,
  onScrollChange,
  onSelect,
}: {
  groups: typeof quickPhraseGroups;
  scrollTop: number;
  onBack: () => void;
  onScrollChange: (scrollTop: number) => void;
  onSelect: (phrase: QuickPhrase, scrollTop: number) => void;
}) {
  const screenRef = React.useRef<HTMLElement | null>(null);
  const restoredScrollRef = React.useRef(false);
  const featuredPhrases = quickPhrases.filter((phrase) => ['quick-no-chinese', 'quick-english', 'quick-help'].includes(phrase.id));

  React.useEffect(() => {
    if (restoredScrollRef.current) return;
    restoredScrollRef.current = true;
    window.requestAnimationFrame(() => {
      if (screenRef.current) {
        screenRef.current.scrollTop = scrollTop;
      }
    });
  }, []);

  return (
    <section
      className="screen quick-phrases-screen"
      ref={screenRef}
      onScroll={(event) => onScrollChange(event.currentTarget.scrollTop)}
    >
      <header className="quick-phrases-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Quick Phrases</p>
        <h1>Say it quickly.</h1>
        <span>Everyday Chinese for small moments.</span>
      </header>

      <section className="quick-phrase-featured" aria-label="Useful now">
        {featuredPhrases.map((phrase) => (
          <button className="quick-phrase-card featured" type="button" key={phrase.id} onClick={() => onSelect(phrase, screenRef.current?.scrollTop ?? 0)}>
            <strong>{phrase.chinese}</strong>
            <small>{phrase.english}</small>
            <span>{phrase.situation}</span>
          </button>
        ))}
      </section>

      <div className="quick-phrase-groups">
        {groups.map((group) => (
          <section className="quick-phrase-group" key={group.id}>
            <header>
              <h2>{group.title}</h2>
              <p>{group.subtitle}</p>
            </header>
            <div className="quick-phrase-list">
              {group.phrases.map((phrase) => (
                <button className="quick-phrase-card" type="button" key={phrase.id} onClick={() => onSelect(phrase, screenRef.current?.scrollTop ?? 0)}>
                  <strong>{phrase.chinese}</strong>
                  <small>{phrase.english}</small>
                  <span>{phrase.situation}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function ExploreDishAiPage({
  dishQuery,
  selectedExample,
  onBack,
  onChange,
  onExampleChange,
  onResult,
}: {
  dishQuery: string;
  selectedExample: string;
  onBack: () => void;
  onChange: (value: string) => void;
  onExampleChange: (value: string) => void;
  onResult: (result: DishExploreResult) => void;
}) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const examples = ['Mapo Tofu', 'Peking Duck', 'Hot Pot', 'Xiaolongbao'];

  const exploreDish = async (nextQuery = dishQuery) => {
    const value = nextQuery.trim();
    if (!value) {
      setError('Please enter a dish name.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setError('');
    onChange(value);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch('/api/explore-dish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName: value }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "We couldn't identify this dish. Try entering the Chinese name or checking the spelling.");
      }

      const dishResult = payload as DishExploreResult;
      if (dishResult.recognitionStatus === 'unable_to_confirm') {
        throw new Error("We couldn't identify this dish. Try the Chinese name or check the spelling.");
      }

      onResult(dishResult);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        setError('This is taking too long. Please try again.');
      } else {
        setError(requestError instanceof Error ? requestError.message : "We couldn't identify this dish. Try the Chinese name or check the spelling.");
      }
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  return (
    <section className="screen understand-menu-screen explore-dish-screen">
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Restaurant</p>
        <h1>Explore a Dish</h1>
        <span>My friend recommended Mapo Tofu. What is it?</span>
      </header>

      <DishSearchForm
        value={dishQuery}
        examples={examples}
        selectedExample={selectedExample}
        isLoading={isLoading}
        onChange={(value) => {
          onChange(value);
          onExampleChange('');
          setError('');
        }}
        onSubmit={() => exploreDish()}
        onExample={(example) => {
          onChange(example);
          onExampleChange(example);
          setError('');
        }}
      />
      {isLoading ? <div className="menu-loading menu-calm-loading"><div className="spinner" /><p>Understanding this dish...</p></div> : null}
      {error ? <div className="error-panel menu-error-panel"><strong>We couldn't identify this dish.</strong><p>{error}</p></div> : null}
    </section>
  );
}

function DishSearchForm({ value, examples, selectedExample, isLoading, onChange, onSubmit, onExample }: { value: string; examples: string[]; selectedExample: string; isLoading: boolean; onChange: (value: string) => void; onSubmit: () => void; onExample: (value: string) => void }) {
  return (
    <form className="dish-search-form explore-dish-form" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <label className="text-field explore-dish-field">
        <span>Dish name</span>
        <input type="text" placeholder="e.g. Mapo Tofu or 麻婆豆腐" value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
      <button className="menu-understand-button" type="submit" disabled={isLoading}><Search size={19} aria-hidden="true" />Explore Dish</button>
      <div className="example-row" aria-label="Example dishes">
        {examples.map((example) => (
          <button key={example} className={`choice-pill ${selectedExample === example ? 'selected-choice-pill' : ''}`} type="button" disabled={isLoading} onClick={() => onExample(example)}>
            {example}
          </button>
        ))}
      </div>
    </form>
  );
}

function DishResultCard({ result, onOrder }: { result: DishExploreResult; onOrder: () => void }) {
  if (result.recognitionStatus === 'unable_to_confirm') {
    return (
      <div className="error-panel">
        <strong>We couldn't identify this dish</strong>
        <p>Try entering the Chinese name or checking the spelling.</p>
      </div>
    );
  }

  return (
    <article className="dish-result-card">
      <header className="dish-hero">
        <span className="badge">{result.recognitionStatus === 'uncertain' ? 'Uncertain result' : 'Dish guide'}</span>
        <h2>{result.englishName}</h2>
        <p className="large-chinese-name">{result.chineseName}</p>
        {result.pinyin ? <small>{result.pinyin}</small> : null}
      </header>
      <p className="dish-description">{result.shortDescription}</p>
      {result.origin ? <p className="plain-copy"><strong>Origin:</strong> {result.origin}</p> : null}
      <div className="dish-summary-grid">
        <DishMiniPanel title="Spice level" body={result.spiceLevel} tone={spiceTone(result.spiceLevel)} />
        <DishMiniPanel title="Beginner friendly" body={result.beginnerFriendly ? 'Yes' : 'Maybe not'} />
      </div>
      <DishTags title="Main ingredients" tags={result.mainIngredients} />
      <DishTags title="Flavor" tags={result.flavorProfile} />
      <DishTags title="Common allergens" tags={result.commonAllergens} warning />
      <DishTags title="Dietary notes" tags={result.dietaryNotes} warning />
      <div className="detail-list">
        <Detail title="How it is served" body={result.howItIsServed} />
        <Detail title="How to eat" body={result.howToEat} />
        <Detail title="Good for one person or sharing" body={result.portionGuide} />
      </div>
      <WarningCard text="Ingredients and allergen information may be incomplete. Confirm with restaurant staff." />
      <button className="primary-button order-dish-button" type="button" onClick={onOrder}><ChefHat size={19} aria-hidden="true" />Order This Dish</button>
    </article>
  );
}

function DishMiniPanel({ title, body, tone }: { title: string; body: string; tone?: string }) {
  return (
    <div className={`dish-mini-panel ${tone ?? ''}`}>
      <span>{title}</span>
      <strong>{body}</strong>
    </div>
  );
}

function DishTags({ title, tags, warning }: { title: string; tags: string[]; warning?: boolean }) {
  if (!tags.length) return null;

  return (
    <section className="dish-tags">
      <h3>{title}</h3>
      <div>{tags.map((tag) => <span key={tag} className={warning ? 'warning-tag' : ''}>{tag}</span>)}</div>
    </section>
  );
}

function OrderDishCard({ result, onClose }: { result: DishExploreResult; onClose: () => void }) {
  return (
    <div className="order-dish-card">
      <p className="order-chinese">{result.orderingPhraseChinese || `????${result.chineseName}?`}</p>
      {result.orderingPhrasePinyin ? <p className="order-pinyin">{result.orderingPhrasePinyin}</p> : null}
      <p className="order-english">{result.orderingPhraseEnglish || `I'd like one ${result.englishName}.`}</p>
      <button className="secondary-button" type="button" disabled><Volume2 size={19} aria-hidden="true" />Play Audio <span className="button-badge">TODO</span></button>
      <button className="secondary-button" type="button" onClick={onClose}>Done</button>
    </div>
  );
}

function spiceTone(spiceLevel: DishExploreResult['spiceLevel']) {
  if (spiceLevel === 'Spicy' || spiceLevel === 'Very spicy') return 'spicy-panel';
  if (spiceLevel === 'Medium') return 'medium-spice-panel';
  return '';
}

function ExploreDishPage({ dishQuery, onBack, onChange, onSearch }: { dishQuery: string; onBack: () => void; onChange: (value: string) => void; onSearch: () => void }) {
  return (
    <section className="screen">
      <PageHeader title="What dish do you want to understand?" description="Mock dish explainer" onBack={onBack} />
      <label className="text-field"><span>Dish name</span><input type="text" placeholder="e.g. Mapo tofu, 麻婆豆腐" value={dishQuery} onChange={(event) => onChange(event.target.value)} /></label>
      <button className="primary-button footer-button" type="button" disabled={!dishQuery.trim()} onClick={onSearch}><Search size={19} aria-hidden="true" />Explain</button>
    </section>
  );
}

function ProcessingPage({ title, onDone }: { title: string; onDone: () => void }) {
  React.useEffect(() => {
    const timer = window.setTimeout(onDone, 650);
    return () => window.clearTimeout(timer);
  }, [onDone]);
  return <section className="screen processing-screen" aria-live="polite"><div className="spinner" /><p>{title}</p><span>Prototype</span></section>;
}

function DishResultPage({ dishQuery, onBack }: { dishQuery: string; onBack: () => void }) {
  const result = useMemo(() => getDishResult(dishQuery), [dishQuery]);
  return (
    <section className="screen">
      <PageHeader title={result.englishName} description="Mock result" onBack={onBack} />
      <p className="large-chinese-name">{result.chineseName}</p>
      <div className="detail-list">
        <Detail title="What it is" body={result.whatItIs} />
        <Detail title="Main ingredients" body={result.ingredients} />
        <Detail title="Taste" body={result.taste} />
        <Detail title="Spiciness" body={result.spiciness} />
        <Detail title="Common allergens" body={result.allergens} />
        <Detail title="Region of origin" body={result.region} />
        <Detail title="Vegetarian suitability" body={result.vegetarian} />
      </div>
    </section>
  );
}

function getDishResult(query: string): Dish {
  const normalized = query.trim().toLowerCase();
  return mockDishes.find((dish) => dish.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) ?? mockDishes[0];
}

function TaxiDestinationPage({
  session,
  onSessionChange,
  onBack,
  onFormatted,
}: {
  session: AddressHelperSession;
  onSessionChange: React.Dispatch<React.SetStateAction<AddressHelperSession>>;
  onBack: () => void;
  onFormatted: (result: AddressTranslationResult) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const value = session.input;

  async function formatDestination() {
    const supplement = [session.city, session.district, session.landmark].map((item) => item.trim()).filter(Boolean);
    const destination = [value.trim(), supplement.length ? `Additional details: ${supplement.join(', ')}` : ''].filter(Boolean).join('\n');
    if (!destination) {
      setError('Please enter an address or place name.');
      return;
    }

    if (value.trim().length < 2 || !/[\p{L}\p{N}\p{Script=Han}]/u.test(value)) {
      setError('Try adding a real address, place name, city, or nearby landmark.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setError('');
    onSessionChange((current) => ({ ...current, warningResult: null }));

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch('/api/format-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "We couldn't format this destination. Try adding the city, district, or a nearby landmark.");
      }

      const result = normalizeAddressResultForDisplay(payload as AddressTranslationResult, value);
      if (shouldAskForMoreAddressDetails(value, result, session)) {
        onSessionChange((current) => ({ ...current, warningResult: result }));
        return;
      }

      onFormatted(result);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        setError('This is taking too long. Please try again.');
      } else {
        setError(requestError instanceof Error ? requestError.message : "We couldn't format this destination. Try adding the city, district, or a nearby landmark.");
      }
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  return (
    <section className="screen understand-menu-screen address-form-screen">
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Address Helper</p>
        <h1>Where do you want to go?</h1>
        <span>Paste a Chinese or English address.</span>
      </header>

      <section className="address-input-card">
        <label className="address-text-field">
          <span>Address or place name</span>
          <textarea
            placeholder={'e.g. 上海市黄浦区南京东路300号\nor No. 300 East Nanjing Road, Shanghai'}
            value={value}
            onChange={(event) => {
              onSessionChange((current) => ({ ...current, input: event.target.value, result: null, warningResult: null }));
              setError('');
            }}
          />
        </label>
        <p>Formatted address. Not map-verified.</p>
      </section>
      {isLoading ? <DestinationLoading /> : null}
      {session.warningResult ? (
        <AddressWarning
          result={session.warningResult}
          city={session.city}
          district={session.district}
          landmark={session.landmark}
          onChange={(field, nextValue) => onSessionChange((current) => ({ ...current, [field]: nextValue }))}
        />
      ) : null}
      {error ? <div className="error-panel"><strong>Something went wrong</strong><p>{error}</p></div> : null}
      <button className="menu-upload-button menu-upload-primary footer-button" type="button" disabled={isLoading || !value.trim()} onClick={formatDestination}>
        {isLoading ? 'Formatting your address...' : 'Create Address Card'}
      </button>
    </section>
  );
}

function DestinationLoading() {
  return <div className="menu-loading"><div className="spinner" /><p>Formatting your address...</p></div>;
}

function AddressWarning({
  result,
  city,
  district,
  landmark,
  onChange,
}: {
  result: AddressTranslationResult;
  city: string;
  district: string;
  landmark: string;
  onChange: (field: 'city' | 'district' | 'landmark', value: string) => void;
}) {
  return (
    <div className="address-more-details">
      <strong>We need more details.</strong>
      <p>{getAddressMoreDetailsMessage(result)}</p>
      <div className="address-detail-fields">
        <label><span>City</span><input value={city} onChange={(event) => onChange('city', event.target.value)} placeholder="e.g. Shanghai" /></label>
        <label><span>District</span><input value={district} onChange={(event) => onChange('district', event.target.value)} placeholder="e.g. Huangpu" /></label>
        <label><span>Nearby landmark</span><input value={landmark} onChange={(event) => onChange('landmark', event.target.value)} placeholder="Station, mall, hotel..." /></label>
      </div>
    </div>
  );
}

function getAddressMoreDetailsMessage(result: AddressTranslationResult) {
  const message = result.ambiguityMessage?.trim();
  if (message && !/[\p{Script=Han}]/u.test(message)) {
    return message;
  }

  return 'Try adding the city, district, or a nearby landmark.';
}

function isSimpleSpecificAddress(input: string) {
  const normalized = input.trim();
  if (!normalized) return false;
  const hasRoadWord = /\b(road|rd\.?|street|st\.?|avenue|ave\.?|lane|ln\.?|boulevard|blvd\.?|drive|dr\.?)\b/i.test(normalized);
  const hasNumber = /\b(no\.?\s*)?\d+[a-z]?\b/i.test(normalized);
  const hasChineseRoad = /[路街道巷弄]\s*\d+号?/.test(normalized);
  return (hasRoadWord && hasNumber) || hasChineseRoad;
}

function normalizeAddressResultForDisplay(result: AddressTranslationResult, originalInput: string): AddressTranslationResult {
  const shouldNormalizeAsUsable = !isGenericAmbiguousPlaceName(originalInput);
  if (!isSimpleSpecificAddress(originalInput) && !shouldNormalizeAsUsable) return result;

  const fallback = isSimpleSpecificAddress(originalInput)
    ? buildSimpleAddressDisplayFallback(originalInput)
    : buildGeneralAddressDisplayFallback(originalInput);
  return {
    ...result,
    chineseAddress: result.chineseAddress || fallback.chineseAddress,
    englishAddress: result.englishAddress || fallback.englishAddress,
    shortChineseLabel: result.shortChineseLabel || fallback.chineseAddress,
    shortEnglishLabel: result.shortEnglishLabel || fallback.englishAddress,
    confidence: result.confidence === 'high' ? 'high' : 'medium',
    isAmbiguous: false,
    needsMoreInformation: false,
    missingInformation: [],
    ambiguityMessage: '',
    formattingNotes: [],
    verificationStatus: 'not_verified',
    driverCard: {
      ...result.driverCard,
      destinationChinese: result.driverCard.destinationChinese || result.chineseAddress || fallback.chineseAddress,
      destinationEnglish: result.driverCard.destinationEnglish || result.englishAddress || fallback.englishAddress,
      instructionChinese: '请带我去这个地址。',
      instructionEnglish: 'Please take me to this address.',
    },
  };
}

function shouldAskForMoreAddressDetails(input: string, result: AddressTranslationResult, session: AddressHelperSession) {
  const hasSupplement = Boolean(session.city.trim() || session.district.trim() || session.landmark.trim());
  if (hasSupplement) return false;
  if (isSimpleSpecificAddress(input)) return false;
  return isGenericAmbiguousPlaceName(input);
}

function isGenericAmbiguousPlaceName(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[“”"'.,，。]/g, '')
    .replace(/\s+/g, ' ');

  if (!normalized) return false;
  if (isSimpleSpecificAddress(normalized)) return false;
  if (/[,\d]/.test(normalized)) return false;

  const genericEnglish = [
    'kfc',
    'starbucks',
    'mcdonalds',
    "mcdonald's",
    'wanda plaza',
    'hotel',
    'station',
    'train station',
    'railway station',
    'airport',
    'shopping mall',
    'mall',
    'restaurant',
  ];

  const genericChinese = [
    '肯德基',
    '星巴克',
    '麦当劳',
    '万达广场',
    '酒店',
    '车站',
    '火车站',
    '高铁站',
    '机场',
    '商场',
    '餐厅',
    '饭店',
  ];

  return genericEnglish.includes(normalized) || genericChinese.includes(normalized);
}

function buildSimpleAddressDisplayFallback(input: string) {
  const normalized = input.replace(/\s+/g, ' ').trim();
  const chineseAddress = normalized
    .replace(/\bno\.?\s*(\d+[a-z]?)\b/gi, '$1号')
    .replace(/\broad\b|\brd\.?\b/gi, '路')
    .replace(/\bstreet\b|\bst\.?\b/gi, '街')
    .replace(/\bavenue\b|\bave\.?\b/gi, '大道')
    .replace(/\blane\b|\bln\.?\b/gi, '巷')
    .replace(/,\s*/g, '')
    .replace(/\s+/g, '');

  return {
    chineseAddress,
    englishAddress: normalized,
  };
}

function buildGeneralAddressDisplayFallback(input: string) {
  const normalized = input.replace(/\s+/g, ' ').trim();
  return {
    chineseAddress: normalized,
    englishAddress: normalized,
  };
}

function DriverCard({
  address,
  result,
  savedAddress,
  source,
  onBack,
  onEdit,
  onSaveAddress,
  onRenameAddress,
  onDeleteAddress,
  onSetDestination,
  onDone,
  onStartOver,
}: {
  address: string;
  result: AddressTranslationResult | null;
  savedAddress: SavedAddress | null;
  source: DriverCardSource;
  onBack: () => void;
  onEdit: () => void;
  onSaveAddress: (address: SavedAddress) => void;
  onRenameAddress: (address: SavedAddress) => void;
  onDeleteAddress: (id: string) => void;
  onSetDestination: () => void;
  onDone: () => void;
  onStartOver: () => void;
}) {
  const [statusMessage, setStatusMessage] = useState('');
  const [showBigText, setShowBigText] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveLabel, setSaveLabel] = useState<'Hotel' | 'Station' | 'Airport' | 'Custom'>('Hotel');
  const [nickname, setNickname] = useState('');

  const destinationChinese = result?.driverCard.destinationChinese || result?.chineseAddress || savedAddress?.chineseAddress || address;
  const destinationEnglish = result?.driverCard.destinationEnglish || result?.englishAddress || savedAddress?.englishAddress || savedAddress?.note || '';
  const placeName = savedAddress?.placeName || result?.shortChineseLabel || result?.shortEnglishLabel || result?.parsedAddress?.placeName || '';
  const instructionChinese = result?.driverCard.instructionChinese || '请带我去这个地址。';
  const instructionEnglish = result?.driverCard.instructionEnglish || 'Please take me to this address.';
  const fallbackChinese = `请带我去这里：\n${address}`;

  if (showBigText) {
    return (
      <section className="staff-mode address-fullscreen-mode">
        <div>
          {placeName ? <p className="staff-place-name">{placeName}</p> : null}
          <p className="staff-chinese">{destinationChinese || fallbackChinese}</p>
          <p className="staff-english">{formatEnglishAddress(destinationEnglish || 'Please take me here.')}</p>
        </div>
        <div className="address-fullscreen-actions">
          <button type="button" onClick={() => copyText(destinationChinese || address, 'Chinese address copied.')}>Copy Chinese</button>
          <button type="button" onClick={() => setShowBigText(false)}>Done</button>
        </div>
      </section>
    );
  }

  if (!result && !savedAddress) {
    return (
      <section className="screen understand-menu-screen driver-result-screen">
        <header className="understand-menu-header">
          <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
          <p>Address Helper</p>
          <h1>Show this to your driver</h1>
          <span>Formatted address. Not map-verified.</span>
        </header>
        <div className="driver-card-panel">
          <p className="driver-card-label">Destination</p>
          <p className="driver-destination-chinese">{fallbackChinese}</p>
        </div>
        <div className="display-actions">
          <button className="secondary-button" type="button" onClick={async () => {
            try {
              await navigator.clipboard.writeText(address);
              setStatusMessage('Address copied.');
            } catch {
              setStatusMessage('Copy is not available on this device.');
            }
          }}>Copy Address</button>
          <button className="secondary-button" type="button" onClick={() => setShowBigText(true)}>Show Full Screen</button>
          {source === 'saved-addresses' ? <button className="secondary-button" type="button" onClick={onSetDestination}>Use this address</button> : null}
          {statusMessage ? <p className="prototype-note" role="status">{statusMessage}</p> : null}
          <button className="primary-button" type="button" onClick={onDone}>Done</button>
        </div>
      </section>
    );
  }

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatusMessage(message);
    } catch {
      setStatusMessage('Copy is not available on this device.');
    }
  }

  function saveFormattedAddress() {
    if (!destinationChinese) return;
    onSaveAddress({
      id: `saved-${Date.now()}`,
      label: saveLabel,
      placeName: nickname.trim() || placeName || saveLabel,
      chineseAddress: destinationChinese,
      englishAddress: destinationEnglish,
      note: destinationEnglish,
      result: result ?? undefined,
      lastUsedAt: new Date().toISOString(),
    });
    setShowSaveForm(false);
    setStatusMessage('Address saved.');
  }

  function renameSavedAddress() {
    if (!savedAddress) return;
    const nextName = window.prompt('Rename this address', savedAddress.placeName || savedAddress.label)?.trim();
    if (nextName) {
      onRenameAddress({ ...savedAddress, placeName: nextName });
      setStatusMessage('Address renamed.');
    }
  }

  return (
    <section className="screen understand-menu-screen driver-result-screen">
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Address Helper</p>
        <h1>Show this to your driver</h1>
        <span>Formatted address. Not map-verified.</span>
      </header>
      <article className="driver-card-panel">
        <p className="driver-card-label">Destination</p>
        <p className="driver-destination-chinese">{destinationChinese}</p>
        {destinationEnglish ? <p className="driver-destination-english">{formatEnglishAddress(destinationEnglish)}</p> : null}
        <p className="driver-verification-note">Formatted address. Not map-verified.</p>
        <p className="driver-instruction-chinese">{instructionChinese}</p>
        <p className="driver-instruction-english">{instructionEnglish}</p>
      </article>

      {showSaveForm ? (
        <section className="address-save-card">
          <strong>Save Address</strong>
          <div className="address-label-options" role="group" aria-label="Address label">
            {(['Hotel', 'Station', 'Airport', 'Custom'] as const).map((label) => (
              <button className={saveLabel === label ? 'selected' : ''} type="button" key={label} onClick={() => setSaveLabel(label)}>{label}</button>
            ))}
          </div>
          <label><span>Nickname</span><input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="My Hotel" /></label>
          <button className="menu-upload-button menu-upload-primary" type="button" onClick={saveFormattedAddress}>Save Address</button>
        </section>
      ) : null}

      <div className="display-actions">
        <button className="secondary-button" type="button" onClick={() => copyText(destinationChinese, 'Chinese address copied.')}>Copy Chinese</button>
        {destinationEnglish ? <button className="secondary-button" type="button" onClick={() => copyText(destinationEnglish, 'English address copied.')}>Copy English</button> : null}
        <button className="secondary-button" type="button" onClick={() => setShowBigText(true)}>Show Full Screen</button>
        {source === 'taxi-destination' ? <button className="secondary-button" type="button" onClick={() => setShowSaveForm((current) => !current)}>Save Address</button> : null}
        {source === 'taxi-destination' ? <button className="secondary-button" type="button" onClick={onEdit}>Edit Address</button> : null}
        {source === 'taxi-destination' ? <button className="secondary-button" type="button" onClick={onStartOver}>Start Over</button> : null}
        {source === 'saved-addresses' ? <button className="secondary-button" type="button" onClick={renameSavedAddress}>Rename</button> : null}
        {source === 'saved-addresses' && savedAddress ? <button className="secondary-button" type="button" onClick={() => { if (window.confirm('Delete this saved address?')) onDeleteAddress(savedAddress.id); }}>Delete</button> : null}
        {source === 'saved-addresses' ? <button className="secondary-button" type="button" onClick={onSetDestination}>Use this address</button> : null}
        {statusMessage ? <p className="prototype-note" role="status">{statusMessage}</p> : null}
        <button className="primary-button" type="button" onClick={onDone}>Done</button>
      </div>
    </section>
  );
}

function AddressDetails({ result }: { result: AddressTranslationResult }) {
  const parsedEntries = Object.entries(result.parsedAddress ?? {}).filter(([, value]) => Boolean(value));
  return (
    <section className="address-details">
      <Detail title="Formatted translation" body={`${result.inputType.replace(/_/g, ' ')} · ${result.detectedLanguage} · ${result.confidence} confidence`} />
      <Detail title="Verification" body="Not map-verified." />
      {result.formattingNotes?.length ? <Detail title="Notes" body={result.formattingNotes.join(' ')} /> : null}
      {parsedEntries.length ? (
        <div className="detail-card">
          <h2>Parsed address</h2>
          <div className="parsed-address-grid">
            {parsedEntries.map(([key, value]) => <p key={key}><span>{key}</span><strong>{value}</strong></p>)}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatEnglishAddress(address: string) {
  return address.split(',').map((part) => part.trim()).filter(Boolean).join(',\n');
}

function SavedAddressesPage({
  addresses,
  scrollTop,
  onBack,
  onAdd,
  onTranslate,
  onScrollChange,
  onUse,
  onRename,
  onDelete,
}: {
  addresses: SavedAddress[];
  scrollTop: number;
  onBack: () => void;
  onAdd: () => void;
  onTranslate: () => void;
  onScrollChange: (scrollTop: number) => void;
  onUse: (address: SavedAddress) => void;
  onRename: (address: SavedAddress) => void;
  onDelete: (id: string) => void;
}) {
  const screenRef = React.useRef<HTMLElement | null>(null);
  const restoredScrollRef = React.useRef(false);

  React.useEffect(() => {
    if (restoredScrollRef.current) return;
    restoredScrollRef.current = true;
    window.requestAnimationFrame(() => {
      if (screenRef.current) screenRef.current.scrollTop = scrollTop;
    });
  }, []);

  return (
    <section className="screen understand-menu-screen saved-addresses-screen" ref={screenRef} onScroll={(event) => {
      const nextScrollTop = event.currentTarget.scrollTop;
      onScrollChange(nextScrollTop);
    }}>
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Address Helper</p>
        <h1>Saved Addresses</h1>
        <span>Quickly reopen your hotel, station, airport, or other saved places.</span>
      </header>

      <div className="saved-address-toolbar">
        <button className="menu-upload-button menu-upload-primary" type="button" onClick={onTranslate}>Translate an Address</button>
        <button className="menu-upload-button menu-upload-secondary" type="button" onClick={onAdd}><Plus size={19} aria-hidden="true" />Add Address</button>
      </div>

      <div className="saved-address-list">
        {addresses.length === 0 ? (
          <div className="address-empty-card">
            <MapPin size={34} aria-hidden="true" />
            <strong>No saved addresses yet.</strong>
            <p>Save your hotel or station to reopen it quickly.</p>
          </div>
        ) : null}
        {addresses.map((item) => (
          <div className="saved-address-card" key={item.id}>
            <button type="button" onClick={() => onUse(item)}>
              <span className="saved-address-label">{item.label}</span>
              <strong>{item.placeName || item.label}</strong>
              <small>{item.chineseAddress}</small>
              <em>{item.lastUsedAt ? 'Last used' : 'Saved locally'}</em>
            </button>
            <div className="saved-address-actions">
              <button type="button" onClick={() => {
                const nextName = window.prompt('Rename this address', item.placeName || item.label)?.trim();
                if (nextName) onRename({ ...item, placeName: nextName });
              }}>Rename</button>
              <button type="button" onClick={() => {
                if (window.confirm('Delete this saved address?')) onDelete(item.id);
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AddAddressPage({ onBack, onSave }: { onBack: () => void; onSave: (address: SavedAddress) => void }) {
  const [label, setLabel] = useState<'Hotel' | 'Station' | 'Airport' | 'Custom'>('Hotel');
  const [placeName, setPlaceName] = useState('');
  const [chineseAddress, setChineseAddress] = useState('');
  const [note, setNote] = useState('');
  return (
    <section className="screen understand-menu-screen address-form-screen">
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Address Helper</p>
        <h1>Add Address</h1>
        <span>Save a place you may need to show again.</span>
      </header>
      <section className="address-save-card always-open">
        <strong>Save Address</strong>
        <div className="address-label-options" role="group" aria-label="Address label">
          {(['Hotel', 'Station', 'Airport', 'Custom'] as const).map((option) => (
            <button className={label === option ? 'selected' : ''} type="button" key={option} onClick={() => setLabel(option)}>{option}</button>
          ))}
        </div>
        <label><span>Nickname</span><input value={placeName} onChange={(event) => setPlaceName(event.target.value)} placeholder="My Hotel" /></label>
        <label><span>Chinese address</span><textarea value={chineseAddress} onChange={(event) => setChineseAddress(event.target.value)} placeholder="Paste the Chinese address here" /></label>
        <label><span>Optional note</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Entrance, floor, landmark..." /></label>
      </section>
      <button className="menu-upload-button menu-upload-primary footer-button" type="button" disabled={!label.trim() || !placeName.trim() || !chineseAddress.trim()} onClick={() => onSave({ id: crypto.randomUUID(), label, placeName, chineseAddress, note, lastUsedAt: new Date().toISOString() })}>Save Address</button>
    </section>
  );
}

function RailTicketAiPage({
  session,
  onSessionChange,
  onBack,
}: {
  session: RailTicketSession;
  onSessionChange: React.Dispatch<React.SetStateAction<RailTicketSession>>;
  onBack: () => void;
}) {
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketInfo, setShowTicketInfo] = useState(false);
  const screenRef = React.useRef<HTMLElement | null>(null);
  const restoredScrollRef = React.useRef(false);
  const maxImageBytes = 8 * 1024 * 1024;

  React.useEffect(() => {
    if (restoredScrollRef.current) return;
    restoredScrollRef.current = true;
    window.requestAnimationFrame(() => {
      if (screenRef.current) {
        screenRef.current.scrollTop = session.scrollTop;
      }
    });
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setStatusMessage('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onSessionChange((current) => ({ ...normalizeRailTicketSession(current), error: 'Please choose a JPEG, PNG, or WebP ticket screenshot.' }));
      return;
    }

    try {
      const image = await compressMenuImage(file);

      if (image.size > maxImageBytes) {
        onSessionChange((current) => ({ ...normalizeRailTicketSession(current), error: 'Please choose a ticket screenshot smaller than 8 MB.' }));
        return;
      }

      if (session.previewUrl) {
        URL.revokeObjectURL(session.previewUrl);
      }

      onSessionChange({
        selectedFile: image,
        previewUrl: URL.createObjectURL(image),
        result: null,
        scrollTop: 0,
        error: '',
      });
    } catch {
      onSessionChange((current) => ({ ...normalizeRailTicketSession(current), error: 'We could not read this image. Please try another screenshot.' }));
    }
  }

  function removeImage() {
    if (session.previewUrl) {
      URL.revokeObjectURL(session.previewUrl);
    }

    onSessionChange({
      selectedFile: null,
      previewUrl: '',
      result: null,
      scrollTop: 0,
      error: '',
    });
    setStatusMessage('');
  }

  async function parseTicket() {
    if (!session.selectedFile || isLoading) return;

    setIsLoading(true);
    setStatusMessage('');
    onSessionChange((current) => ({ ...normalizeRailTicketSession(current), error: '' }));

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 55_000);

    try {
      const formData = new FormData();
      formData.append('ticket_image', session.selectedFile);

      const response = await fetch('/api/parse-rail-ticket', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error || 'We could not read this ticket.');
      }

      onSessionChange((current) => ({ ...normalizeRailTicketSession(current), result: normalizeRailTicketClientResult(body), error: '', scrollTop: 0 }));
    } catch (requestError) {
      const nextError = requestError instanceof DOMException && requestError.name === 'AbortError'
        ? 'Ticket understanding took too long. Please try again.'
        : requestError instanceof Error
          ? requestError.message
          : 'We could not read this ticket. Try uploading a clearer screenshot.';
      onSessionChange((current) => ({ ...normalizeRailTicketSession(current), error: nextError }));
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  if (showTicketInfo && session.result) {
    return (
      <RailTicketInfoDisplay
        result={session.result}
        onDone={() => setShowTicketInfo(false)}
        onStatus={setStatusMessage}
      />
    );
  }

  return (
    <section
      className="screen understand-menu-screen rail-ticket-screen"
      ref={screenRef}
      onScroll={(event) => {
        const nextScrollTop = event.currentTarget.scrollTop;
        onSessionChange((current) => ({ ...normalizeRailTicketSession(current), scrollTop: nextScrollTop }));
      }}
    >
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>High-speed Rail</p>
        <h1>{session.result ? 'Your Journey' : 'Understand My Ticket'}</h1>
        <span>{session.result ? 'Know your next step.' : 'I have a ticket screenshot. Where do I go?'}</span>
      </header>

      {!session.result ? (
        <>
          <section className={`menu-photo-card rail-ticket-photo-card ${session.previewUrl ? 'has-menu-photo' : ''}`} aria-label="Ticket screenshot">
            {session.previewUrl ? (
              <>
                <div className="menu-photo-preview">
                  <img src={session.previewUrl} alt="Selected ticket screenshot" />
                </div>
                <div className="menu-photo-actions" aria-label="Change selected ticket screenshot">
                  <label className="menu-small-action file-button">
                    Replace
                    <input accept="image/jpeg,image/png,image/webp" disabled={isLoading} type="file" onChange={handleFileChange} />
                  </label>
                  <label className="menu-small-action file-button">
                    Change
                    <input accept="image/jpeg,image/png,image/webp" disabled={isLoading} type="file" onChange={handleFileChange} />
                  </label>
                  <button className="menu-small-action" type="button" disabled={isLoading} onClick={removeImage}>Remove</button>
                </div>
              </>
            ) : (
              <div className="menu-photo-empty">
                <span className="menu-photo-icon"><ReceiptText size={31} strokeWidth={2.25} aria-hidden="true" /></span>
                <strong>Upload your ticket.</strong>
                <small>Use a 12306, Trip.com, China Railway, or order screenshot.</small>
                <div className="menu-upload-actions">
                  <label className="menu-upload-button menu-upload-primary file-button">
                    <Camera size={19} aria-hidden="true" />
                    Take Photo
                    <input accept="image/jpeg,image/png,image/webp" capture="environment" disabled={isLoading} type="file" onChange={handleFileChange} />
                  </label>
                  <label className="menu-upload-button menu-upload-secondary file-button">
                    <ReceiptText size={19} aria-hidden="true" />
                    Upload Screenshot
                    <input accept="image/jpeg,image/png,image/webp" disabled={isLoading} type="file" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            )}
          </section>

          {session.selectedFile ? (
            <button className="menu-understand-button" type="button" disabled={isLoading} onClick={parseTicket}>
              {isLoading ? 'Understanding your trip...' : session.error ? 'Try Again' : 'Understand My Ticket'}
            </button>
          ) : null}

          {isLoading ? <div className="menu-calm-loading"><p>Understanding your trip...</p></div> : null}
          {session.error ? <div className="error-panel menu-error-panel"><strong>We couldn't read this ticket clearly.</strong><p>{session.error}</p></div> : null}
        </>
      ) : (
        <RailJourneyResult
          result={session.result}
          statusMessage={statusMessage}
          onStatus={setStatusMessage}
          onShowTicketInfo={() => setShowTicketInfo(true)}
          onUploadAnother={removeImage}
        />
      )}
    </section>
  );
}

function RailJourneyResult({
  result,
  onUploadAnother,
  statusMessage,
  onStatus,
  onShowTicketInfo,
}: {
  result: RailTicketResult;
  onUploadAnother: () => void;
  statusMessage: string;
  onStatus: (message: string) => void;
  onShowTicketInfo: () => void;
}) {
  if (result.recognitionStatus === 'unable_to_recognize') {
    return (
      <div className="error-panel">
        <strong>Unable to read this ticket</strong>
        <p>Please upload a clearer 12306, Trip.com, China Railway e-ticket, or order screenshot.</p>
      </div>
    );
  }

  const ticketText = formatRailTicketText(result);
  const usefulNotes = getRailTicketWarnings(result);
  const journeySteps = getRailJourneySteps(result);

  async function copyTicket() {
    try {
      await navigator.clipboard.writeText(ticketText);
      onStatus('Ticket details copied.');
    } catch {
      onStatus('Copy is not available on this device.');
    }
  }

  return (
    <div className="rail-ticket-result rail-journey-result">
      <article className="rail-journey-card">
        <span className="badge">Your Journey</span>
        <strong>{result.trainNumber || 'Train'}</strong>
        <div className="ticket-summary-route">
          <span><strong>{shortStationName(result.fromStationEnglish || result.fromStation)}</strong><small>{result.departureTime || 'Departure'}</small></span>
          <b aria-hidden="true">-&gt;</b>
          <span><strong>{shortStationName(result.toStationEnglish || result.toStation)}</strong><small>{result.arrivalTime || 'Arrival'}</small></span>
        </div>
      </article>

      <section className="rail-before-card">
        <h2>Before You Leave</h2>
        <ul>
          <li>Keep your passport ready.</li>
          <li>Keep this ticket screenshot or app page ready.</li>
          <li>Arrive early enough for security and boarding.</li>
          <li>Gate information may change. Check the station display.</li>
        </ul>
      </section>

      {usefulNotes.length ? <WarningCard text={usefulNotes[0]} /> : null}

      <section className="rail-extra-section">
        <h2>Next Steps</h2>
        <div className="rail-step-list">
          {journeySteps.map((step, index) => <RailJourneyStep step={step} index={index} key={`${step.title}-${index}`} />)}
        </div>
      </section>

      <div className="display-actions rail-result-actions">
        <button className="primary-button" type="button" onClick={onShowTicketInfo}>Show Ticket Info</button>
        <button className="secondary-button" type="button" onClick={copyTicket}><Copy size={19} aria-hidden="true" />Copy Trip Details</button>
        <button className="primary-button" type="button" onClick={onUploadAnother}>Upload Another Ticket</button>
        {statusMessage ? <p className="prototype-note" role="status">{statusMessage}</p> : null}
      </div>
    </div>
  );
}

function RailJourneyStep({ step, index }: { step: RailJourneyStepItem; index: number }) {
  return (
    <article className={`rail-step-card ${step.status === 'current' ? 'current' : ''}`}>
      <span>{index + 1}</span>
      <div>
        <h3>{step.title}</h3>
        {step.value ? <strong>{step.value}</strong> : null}
        <p>{step.description}</p>
      </div>
    </article>
  );
}

function TicketDetail({ title, body, secondary, muted }: { title: string; body: string; secondary?: string; muted?: boolean }) {
  return (
    <article className={`detail-card ticket-detail-card ${muted ? 'muted-ticket-detail' : ''}`}>
      <h2>{title}</h2>
      <p>{body}</p>
      {secondary ? <small>{secondary}</small> : null}
    </article>
  );
}

function RailTicketInfoDisplay({ result, onDone, onStatus }: { result: RailTicketResult; onDone: () => void; onStatus: (message: string) => void }) {
  const gate = result.boardingGate || result.gate || result.checkIn;
  const staffText = formatRailTicketStaffText(result);

  async function copyTicketInfo() {
    try {
      await navigator.clipboard.writeText(staffText);
      onStatus('Ticket info copied.');
    } catch {
      onStatus('Copy is not available on this device.');
    }
  }

  return (
    <section className="staff-mode rail-ticket-info-mode" aria-label="Ticket information for station staff">
      <div className="rail-ticket-info-card">
        <p className="rail-info-train">{result.trainNumber || 'Train'}</p>
        <p className="rail-info-route">{[result.fromStation, result.toStation].filter(Boolean).join(' → ')}</p>
        {(result.fromStationEnglish || result.toStationEnglish) ? <p className="rail-info-english">{[result.fromStationEnglish, result.toStationEnglish].filter(Boolean).join(' to ')}</p> : null}
        <dl>
          {result.departureTime ? <><dt>出发时间</dt><dd>{formatTicketDateTime(result.departureDate, result.departureTime)}</dd></> : null}
          {gate ? <><dt>检票口</dt><dd>{gate}</dd></> : null}
          {cleanTicketUnit(result.coach || result.carriage) ? <><dt>车厢</dt><dd>{cleanTicketUnit(result.coach || result.carriage)}车</dd></> : null}
          {cleanTicketUnit(result.seat) ? <><dt>座位</dt><dd>{cleanTicketUnit(result.seat)}号</dd></> : null}
        </dl>
      </div>
      <button type="button" onClick={copyTicketInfo}>Copy Trip Details</button>
      <button type="button" onClick={onDone}>Done</button>
    </section>
  );
}

function BoardingBasicsPage({ onBack }: { onBack: () => void }) {
  const steps = [
    'Enter the station',
    'Security check',
    'Find the departure board',
    'Find your waiting hall or gate',
    'Wait for boarding',
    'Pass the ticket check',
    'Find the platform',
    'Find your coach',
    'Find your seat',
  ];

  return (
    <section className="screen understand-menu-screen rail-ticket-screen">
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>High-speed Rail</p>
        <h1>Boarding Basics</h1>
        <span>What usually happens at the station?</span>
      </header>
      <div className="boarding-flow rail-basics-flow">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="step-row boarding-step">
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
            {index < steps.length - 1 ? <div className="boarding-arrow" aria-hidden="true">-&gt;</div> : null}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

function formatTicketRoute(result: RailTicketResult) {
  const from = result.fromStationEnglish || result.fromStation;
  const to = result.toStationEnglish || result.toStation;
  return [from, to].filter(Boolean).join(' to ');
}

function safeText(value: unknown) {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

function normalizeRailTicketClientResult(value: unknown): RailTicketResult {
  const raw = value && typeof value === 'object' ? value as Partial<Record<keyof RailTicketResult, unknown>> : {};
  const status = safeText(raw.recognitionStatus);
  const source = safeText(raw.sourceType);
  const confidence = safeText(raw.confidence);

  return {
    recognitionStatus: status === 'recognized' || status === 'uncertain' || status === 'unable_to_recognize' ? status : 'uncertain',
    sourceType: source === '12306' || source === 'trip_com' || source === 'china_railway_e_ticket' || source === 'order_screenshot' || source === 'unknown' ? source : 'unknown',
    trainNumber: safeText(raw.trainNumber),
    fromStation: safeText(raw.fromStation),
    fromStationEnglish: safeText(raw.fromStationEnglish),
    toStation: safeText(raw.toStation),
    toStationEnglish: safeText(raw.toStationEnglish),
    departureDate: safeText(raw.departureDate),
    departureTime: safeText(raw.departureTime),
    arrivalDate: safeText(raw.arrivalDate),
    arrivalTime: safeText(raw.arrivalTime),
    carriage: cleanTicketUnit(raw.carriage),
    seat: cleanTicketUnit(raw.seat),
    seatClass: safeText(raw.seatClass),
    passengerName: safeText(raw.passengerName),
    boardingGate: safeText(raw.boardingGate),
    boardingGateEnglish: safeText(raw.boardingGateEnglish),
    waitingHall: safeText(raw.waitingHall),
    waitingHallEnglish: safeText(raw.waitingHallEnglish),
    platform: safeText(raw.platform),
    platformEnglish: safeText(raw.platformEnglish),
    gate: safeText(raw.gate),
    gateEnglish: safeText(raw.gateEnglish),
    checkIn: safeText(raw.checkIn),
    checkInEnglish: safeText(raw.checkInEnglish),
    coach: cleanTicketUnit(raw.coach),
    ticketNumber: safeText(raw.ticketNumber),
    orderNumber: safeText(raw.orderNumber),
    notes: Array.isArray(raw.notes) ? raw.notes.map(safeText).filter(Boolean) : [],
    confidence: confidence === 'high' || confidence === 'medium' || confidence === 'low' ? confidence : 'medium',
    needsManualCheck: typeof raw.needsManualCheck === 'boolean' ? raw.needsManualCheck : true,
  };
}

function normalizeRailTicketSession(value: unknown): RailTicketSession {
  if (!value || typeof value !== 'object') {
    return { ...emptyRailTicketSession };
  }

  const raw = value as Partial<RailTicketSession>;
  return {
    selectedFile: raw.selectedFile instanceof File ? raw.selectedFile : null,
    previewUrl: typeof raw.previewUrl === 'string' ? raw.previewUrl : '',
    result: raw.result ? normalizeRailTicketClientResult(raw.result) : null,
    scrollTop: typeof raw.scrollTop === 'number' && Number.isFinite(raw.scrollTop) ? raw.scrollTop : 0,
    error: typeof raw.error === 'string' ? raw.error : '',
  };
}

function shortStationName(value: unknown) {
  return safeText(value)
    .replace(/\s*Railway Station$/i, '')
    .replace(/\s*Rail Station$/i, '')
    .trim();
}

function formatTicketDateTime(date: unknown, time: unknown) {
  return [safeText(date), safeText(time)].filter(Boolean).join(' ');
}

function formatSeatInfo(result: RailTicketResult) {
  const coach = cleanTicketUnit(result.coach || result.carriage);
  const seat = cleanTicketUnit(result.seat);
  return [
    coach ? `Coach ${coach}` : '',
    seat ? `Seat ${seat}` : '',
  ].filter(Boolean).join(' · ');
}

function formatSeatSecondary(result: RailTicketResult) {
  const coach = cleanTicketUnit(result.coach || result.carriage);
  const seat = cleanTicketUnit(result.seat);
  const chineseSeat = [coach ? `${coach}车` : '', seat ? `${seat}号` : ''].filter(Boolean).join(' · ');
  return [chineseSeat, result.seatClass].filter(Boolean).join(' · ');
}

function cleanTicketUnit(value: unknown) {
  return safeText(value)
    .replace(/^(car|coach|seat)\s*/i, '')
    .replace(/[车号]/g, '')
    .replace(/^0+(?=\d)/, '')
    .trim();
}

function formatRailTicketText(result: RailTicketResult) {
  return [
    result.trainNumber ? `Train Number: ${result.trainNumber}` : '',
    formatBilingualLine('From', result.fromStation, result.fromStationEnglish),
    formatBilingualLine('To', result.toStation, result.toStationEnglish),
    formatTicketDateTime(result.departureDate, result.departureTime) ? `Departure: ${formatTicketDateTime(result.departureDate, result.departureTime)}` : '',
    formatTicketDateTime(result.arrivalDate, result.arrivalTime) ? `Arrival: ${formatTicketDateTime(result.arrivalDate, result.arrivalTime)}` : '',
    formatSeatInfo(result) ? `Seat: ${formatSeatInfo(result)}` : '',
    formatBilingualLine('Boarding Gate', result.boardingGate || result.gate, result.boardingGateEnglish || result.gateEnglish),
    formatBilingualLine('Waiting Hall', result.waitingHall, result.waitingHallEnglish),
    formatBilingualLine('Platform', result.platform, result.platformEnglish),
    formatBilingualLine('Check-in', result.checkIn, result.checkInEnglish),
  ].filter(Boolean).join('\n');
}

function formatRailTicketStaffText(result: RailTicketResult) {
  const gate = result.boardingGate || result.gate || result.checkIn;
  return [
    result.trainNumber ? `车次: ${result.trainNumber}` : '',
    result.fromStation ? `出发站: ${result.fromStation}` : '',
    result.toStation ? `到达站: ${result.toStation}` : '',
    result.departureTime ? `出发时间: ${formatTicketDateTime(result.departureDate, result.departureTime)}` : '',
    gate ? `检票口: ${gate}` : '',
    cleanTicketUnit(result.coach || result.carriage) ? `车厢: ${cleanTicketUnit(result.coach || result.carriage)}车` : '',
    cleanTicketUnit(result.seat) ? `座位: ${cleanTicketUnit(result.seat)}号` : '',
  ].filter(Boolean).join('\n');
}

function getRailJourneySteps(result: RailTicketResult): RailJourneyStepItem[] {
  const gate = result.boardingGate || result.gate || result.checkIn;
  const gateEnglish = result.boardingGateEnglish || result.gateEnglish || result.checkInEnglish;
  const coach = cleanTicketUnit(result.coach || result.carriage);
  const seat = cleanTicketUnit(result.seat);
  const waitingHall = result.waitingHall;
  const platform = result.platform;

  return [
    {
      title: 'Enter the station',
      description: 'Use the correct departure station and keep your passport ready.',
    },
    {
      title: 'Security',
      description: 'Follow the security check before entering the waiting area.',
    },
    {
      title: waitingHall ? 'Waiting Hall' : 'Find the waiting area',
      value: waitingHall ? [waitingHall, result.waitingHallEnglish].filter(Boolean).join(' · ') : undefined,
      description: waitingHall ? 'Wait here until boarding starts.' : 'Check the station display for your waiting hall or gate.',
    },
    {
      title: gate ? 'Ticket Gate' : 'Find your gate',
      value: gate ? [gate, gateEnglish].filter(Boolean).join(' · ') : undefined,
      description: gate ? 'Watch the station display in case it changes.' : 'Gate information may appear closer to boarding.',
      status: 'current',
    },
    {
      title: platform ? 'Platform' : 'Find the platform',
      value: platform ? [platform, result.platformEnglish].filter(Boolean).join(' · ') : undefined,
      description: platform ? 'Go to this platform after ticket check.' : 'Platform information may appear after boarding starts.',
    },
    {
      title: coach ? 'Coach' : 'Find your coach',
      value: coach ? `Coach ${coach} · ${coach}车` : undefined,
      description: coach ? 'Coach numbers are shown outside each train car.' : 'Check your ticket or ask station staff for your coach.',
    },
    {
      title: seat ? 'Seat' : 'Find your seat',
      value: seat ? `Seat ${seat} · ${seat}号` : undefined,
      description: seat ? 'Seat numbers are shown above or beside the seats.' : 'Check your ticket or ask staff for your seat.',
    },
  ];
}

function getRailDetails(result: RailTicketResult) {
  return [
    { title: 'Departure', body: formatTicketDateTime(result.departureDate, result.departureTime) },
    { title: 'Arrival', body: formatTicketDateTime(result.arrivalDate, result.arrivalTime) },
    { title: 'Seat', body: formatSeatInfo(result), secondary: formatSeatSecondary(result) },
    { title: 'Seat Class', body: result.seatClass },
    { title: 'Waiting Hall', body: result.waitingHall, secondary: result.waitingHallEnglish },
    { title: 'Platform', body: result.platform, secondary: result.platformEnglish },
  ].filter((field) => Boolean(field.body));
}

function getRailPhraseGroups(result: RailTicketResult | null): RestaurantPhraseGroup[] {
  const coach = cleanTicketUnit(result?.coach || result?.carriage || '');
  return railPhraseGroups.map((group) => ({
    ...group,
    phrases: group.phrases.map((phrase) => {
      if (phrase.id !== 'rail-coach') return phrase;
      return coach
        ? {
            ...phrase,
            english: `Can you help me find coach ${coach}?`,
            chinese: `可以帮我找一下${coach}号车厢吗？`,
          }
        : phrase;
    }),
  }));
}

function formatBilingualLine(label: string, primary: unknown, secondary?: unknown) {
  const main = safeText(primary);
  const sub = safeText(secondary);
  if (!main && !sub) return '';
  if (main && sub) return `${label}: ${main} / ${sub}`;
  return `${label}: ${main || sub}`;
}

function getRailTicketWarnings(result: RailTicketResult) {
  const warnings = filterRailTicketNotes(result.notes);
  const hasBoardingGate = Boolean(result.boardingGate || result.gate || result.checkIn);

  if (!hasBoardingGate) {
    warnings.unshift('Please verify the boarding gate at the station.');
  }

  if (result.arrivalTime && !result.arrivalDate) {
    warnings.push('The arrival date is not shown. Confirm it if your trip crosses midnight.');
  }

  if (!result.seat) {
    warnings.push('Seat information is not shown. Check your ticket app or ask station staff.');
  }

  return [...new Set(warnings)];
}

function filterRailTicketNotes(notes: unknown) {
  const hiddenPatterns = [
    'copyable',
    'order number',
    'source',
    'classified',
    'classification',
    'layout',
    'ocr',
    'confidence',
    'not explicit',
    'based on',
    'screenshot type',
    'ticket/platform',
  ];

  const noteList = Array.isArray(notes) ? notes.map(safeText).filter(Boolean) : [];

  return noteList.filter((note) => {
    const normalizedNote = note.toLowerCase();
    return !hiddenPatterns.some((pattern) => normalizedNote.includes(pattern));
  });
}

function RailTicketPage({ onBack }: { onBack: () => void }) {
  const fields = [
    ['Train number', 'G1234'],
    ['Departure station', 'Shanghai Hongqiao'],
    ['Arrival station', 'Beijing South'],
    ['Date and time', '2026-07-19 09:00'],
    ['Boarding gate', 'Gate 12A'],
    ['Carriage', 'Car 05'],
    ['Seat', '12F'],
  ];
  return (
    <section className="screen">
      <PageHeader title="Understand My Ticket" description="Mock ticket guide" onBack={onBack} />
      <div className="ticket-card"><span className="badge">Sample</span><strong>G1234</strong><p>Shanghai Hongqiao 闁?Beijing South</p></div>
      <div className="detail-list">{fields.map(([title, body]) => <Detail title={title} body={body} key={title} />)}</div>
    </section>
  );
}

function StepTaskPage({ title, description, steps, onBack, phrase, onPhrase, warning }: { title: string; description: string; steps: string[]; onBack: () => void; phrase?: { label: string; phrase: Phrase }; onPhrase?: (phrase: Phrase) => void; warning?: string }) {
  return (
    <section className="screen">
      <PageHeader title={title} description={description} onBack={onBack} />
      {warning ? <WarningCard text={warning} /> : null}
      <div className="step-list">{steps.map((step, index) => <div className="step-row" key={step}><span>{index + 1}</span><p>{step}</p></div>)}</div>
      {phrase && onPhrase ? <button className="secondary-button footer-button" type="button" onClick={() => onPhrase(phrase.phrase)}>{phrase.label}</button> : null}
    </section>
  );
}

function RailIssuePage({ onBack, onChoose }: { onBack: () => void; onChoose: (issue: string) => void }) {
  return (
    <section className="screen">
      <PageHeader title="What happened?" description="Rail help" onBack={onBack} />
      <div className="card-list tool-list">
        {Object.entries(railIssueContent).map(([key, value]) => <button className="scenario-card" type="button" key={key} onClick={() => onChoose(key)}><span className="scenario-icon"><AlertTriangle size={24} aria-hidden="true" /></span><span><strong>{value.title}</strong><small>See next steps and a Chinese help card.</small></span></button>)}
      </div>
    </section>
  );
}

function RailIssueResultPage({ issue, onBack, onShow }: { issue: { title: string; steps: string[]; phrase: Phrase }; onBack: () => void; onShow: (phrase: Phrase) => void }) {
  return (
    <section className="screen">
      <PageHeader title={issue.title} description="Next steps" onBack={onBack} />
      <div className="step-list">{issue.steps.map((step, index) => <div className="step-row" key={step}><span>{index + 1}</span><p>{step}</p></div>)}</div>
      <button className="primary-button footer-button" type="button" onClick={() => onShow(issue.phrase)}>Show Chinese Help Card</button>
    </section>
  );
}

function UnderstandProductPage({ onBack }: { onBack: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState<ProductUnderstandResult | null>(null);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const maxImageBytes = 8 * 1024 * 1024;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setStatusMessage('');
    setResult(null);

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }

    try {
      const image = await compressMenuImage(file);
      if (image.size > maxImageBytes) {
        setError('Please choose an image smaller than 8 MB.');
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(image);
      setPreviewUrl(URL.createObjectURL(image));
    } catch {
      setError('We could not open this photo. Please try another product image.');
    }
  }

  function removeImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    setStatusMessage('');
  }

  async function understandProduct() {
    if (!selectedFile || isLoading) return;

    setIsLoading(true);
    setError('');
    setStatusMessage('');

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 55_000);

    try {
      const formData = new FormData();
      formData.append('product_image', selectedFile);

      const response = await fetch('/api/understand-product', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error || 'We could not understand this product.');
      }

      setResult(body as ProductUnderstandResult);
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === 'AbortError'
          ? 'Understanding this product took too long. Please try again.'
          : requestError instanceof Error
            ? requestError.message
            : 'We could not understand this product. Try uploading a clearer photo.',
      );
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  return (
    <section className="screen understand-menu-screen shopping-product-screen">
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Shopping</p>
        <h1>Understand a Product</h1>
        <span>I found something interesting. What is it?</span>
      </header>

      <section className={`menu-photo-card shopping-product-photo-card ${previewUrl ? 'has-menu-photo' : ''}`} aria-label="Product photo">
        {previewUrl ? (
          <>
            <div className="menu-photo-preview">
              <img src={previewUrl} alt="Selected product" />
            </div>
            <div className="menu-photo-actions" aria-label="Change selected photo">
              <label className={`menu-small-action file-button ${isLoading ? 'disabled-button' : ''}`}>
                Retake
                <input accept="image/jpeg,image/png,image/webp" capture="environment" disabled={isLoading} type="file" onChange={handleFileChange} />
              </label>
              <label className={`menu-small-action file-button ${isLoading ? 'disabled-button' : ''}`}>
                Change
                <input accept="image/jpeg,image/png,image/webp" disabled={isLoading} type="file" onChange={handleFileChange} />
              </label>
              <button className="menu-small-action" type="button" disabled={isLoading} onClick={removeImage}>Delete</button>
            </div>
          </>
        ) : (
          <div className="menu-photo-empty">
            <span className="menu-photo-icon"><ShoppingBag size={31} strokeWidth={2.25} aria-hidden="true" /></span>
            <strong>What is this product?</strong>
            <small>Take a clear photo with the package name or label visible.</small>
          </div>
        )}
      </section>

      {!previewUrl ? (
        <div className="menu-upload-actions">
          <label className={`menu-upload-button menu-upload-primary file-button ${isLoading ? 'disabled-button' : ''}`}>
            <Camera size={20} strokeWidth={2.25} aria-hidden="true" />
            Take a Photo
            <input accept="image/jpeg,image/png,image/webp" capture="environment" disabled={isLoading} type="file" onChange={handleFileChange} />
          </label>
          <label className={`menu-upload-button menu-upload-secondary file-button ${isLoading ? 'disabled-button' : ''}`}>
            <ReceiptText size={20} strokeWidth={2.25} aria-hidden="true" />
            Upload an Image
            <input accept="image/jpeg,image/png,image/webp" disabled={isLoading} type="file" onChange={handleFileChange} />
          </label>
        </div>
      ) : null}

      {selectedFile ? (
        <button className="menu-understand-button shopping-understand-button" type="button" disabled={isLoading} onClick={understandProduct}>
          {isLoading ? 'Understanding this product...' : result || error ? 'Try Again' : 'Understand Product'}
        </button>
      ) : null}

      {isLoading ? <div className="menu-loading menu-calm-loading"><div className="spinner" /><p>Understanding this product...</p></div> : null}
      {error ? <div className="error-panel menu-error-panel"><strong>We couldn't understand this product.</strong><p>{error}</p></div> : null}
      {result ? <ProductResultCard result={result} onUploadAnother={removeImage} statusMessage={statusMessage} onStatus={setStatusMessage} /> : null}
    </section>
  );
}

function ProductResultCard({
  result,
  onUploadAnother,
  statusMessage,
  onStatus,
}: {
  result: ProductUnderstandResult;
  onUploadAnother: () => void;
  statusMessage: string;
  onStatus: (message: string) => void;
}) {
  if (result.recognitionStatus === 'unable_to_recognize') {
    return (
      <div className="error-panel menu-error-panel">
        <strong>Unable to understand this product</strong>
        <p>Please try a clearer photo with the package or label visible.</p>
      </div>
    );
  }

  const copyText = formatProductText(result);
  const { quickFacts, goodToKnow } = getProductResultSections(result);

  async function copyProduct() {
    try {
      await navigator.clipboard.writeText(copyText);
      onStatus('Product details copied.');
    } catch {
      onStatus('Copy is not available on this device.');
    }
  }

  async function shareProduct() {
    try {
      const browserNavigator = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
        clipboard?: Clipboard;
      };

      if (browserNavigator.share) {
        await browserNavigator.share({ title: 'Product details', text: copyText });
        onStatus('');
        return;
      }

      if (browserNavigator.clipboard) {
        await browserNavigator.clipboard.writeText(copyText);
        onStatus('Sharing is not available here. Product details copied instead.');
        return;
      }

      onStatus('Share is not available on this device.');
    } catch {
      onStatus('Share is not available on this device.');
    }
  }

  return (
    <div className="menu-result product-result-card">
      <article className="menu-result-header product-hero">
        <span className="badge">This appears to be</span>
        <h2>{result.productName || 'Product'}</h2>
        {result.originalName ? <small>{result.originalName}</small> : null}
        {result.category ? <p className="product-category">{formatProductCategory(result.category)}</p> : null}
      </article>

      {result.description ? <section className="menu-dish-detail-card product-summary-card"><strong>What it is</strong><p>{result.description}</p></section> : null}
      {result.needsManualCheck || result.recognitionStatus === 'uncertain' ? <WarningCard text="Some product details may be incomplete. Check the package or ask shop staff if it matters." /> : null}
      {result.category === 'medicine' ? <WarningCard text="This helps with package understanding only. It does not provide medical advice." /> : null}
      {result.allergens.length ? <WarningCard text="Allergen information may be incomplete. Confirm from the package or shop staff." /> : null}

      {quickFacts.length ? (
        <section className="product-info-section">
          <h3>Quick Facts</h3>
          <div className="product-quick-facts">
            {quickFacts.map((fact) => (
              <div className="product-quick-fact" key={fact.label}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {goodToKnow.length ? (
        <section className="product-info-section">
          <h3>Good to Know</h3>
          <div className="product-good-list">
            {goodToKnow.map((item) => <p key={item}>{item}</p>)}
          </div>
        </section>
      ) : null}

      <div className="menu-detail-actions product-actions">
        <button className="menu-understand-button" type="button" onClick={onUploadAnother}>Upload Another Product</button>
        <button className="menu-small-action" type="button" onClick={copyProduct}><Copy size={18} aria-hidden="true" />Copy</button>
        <button className="menu-small-action" type="button" onClick={shareProduct}><Share2 size={18} aria-hidden="true" />Share</button>
        {statusMessage ? <p className="prototype-note" role="status">{statusMessage}</p> : null}
      </div>
    </div>
  );
}

function ProductTags({ title, items, warning }: { title: string; items: string[]; warning?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="dish-tags product-tags">
      <h3>{title}</h3>
      <div>{items.map((item) => <span className={warning ? 'warning-tag' : ''} key={item}>{item}</span>)}</div>
    </section>
  );
}

function getProductResultSections(result: ProductUnderstandResult) {
  const quickFacts: Array<{ label: string; value: string }> = [];
  const goodToKnow: string[] = [];
  const addQuickFact = (label: string, value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    quickFacts.push({ label, value: cleanValue });
  };
  const addGoodToKnow = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue || goodToKnow.includes(cleanValue)) return;
    goodToKnow.push(cleanValue);
  };
  const addGoodList = (items: string[]) => items.forEach(addGoodToKnow);

  if (result.category && result.category !== 'unknown') {
    addQuickFact('Category', formatProductCategory(result.category));
  }

  if (result.flavor) {
    addQuickFact('Flavor', result.flavor);
  }

  if (result.alcohol) {
    addQuickFact('Alcohol', result.alcohol);
  }

  if (result.category === 'medicine') {
    addGoodToKnow(result.whatItIs || result.description);
    addGoodToKnow(result.howToUse);
  }

  if (result.category === 'skincare' || result.category === 'cosmetics') {
    addGoodToKnow(result.whatItDoes || result.description);
    addQuickFact('Skin type', result.skinType);
    if (result.keyIngredients.length) addGoodToKnow(`Key ingredients: ${result.keyIngredients.join(', ')}`);
  }

  if (result.sugar) {
    addGoodToKnow(result.sugar);
  }

  if (result.caffeine) {
    addGoodToKnow(result.caffeine);
  }

  if (result.allergens.length) {
    addGoodToKnow(`Allergens: ${result.allergens.join(', ')}`);
  }

  addGoodList(result.warnings);
  addGoodList(result.notes);

  return { quickFacts, goodToKnow };
}

function formatProductCategory(category: ProductCategory) {
  const labels: Record<ProductCategory, string> = {
    food: 'Food / Snack',
    drink: 'Drink',
    medicine: 'Medicine',
    skincare: 'Skincare',
    cosmetics: 'Cosmetics',
    daily_goods: 'Daily Goods',
    souvenir: 'Souvenir',
    unknown: 'Unknown',
  };
  return labels[category];
}

function formatProductText(result: ProductUnderstandResult) {
  return [
    result.productName ? `Product: ${result.productName}` : '',
    result.originalName ? `Original name: ${result.originalName}` : '',
    result.category ? `Category: ${formatProductCategory(result.category)}` : '',
    result.description ? `Description: ${result.description}` : '',
    result.ingredients.length ? `Ingredients: ${result.ingredients.join(', ')}` : '',
    result.allergens.length ? `Allergens: ${result.allergens.join(', ')}` : '',
    result.warnings.length ? `Warnings: ${result.warnings.join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

function LiveCurrencyConverterPage({
  session,
  onSessionChange,
  onBack,
}: {
  session: ShoppingPriceSession;
  onSessionChange: React.Dispatch<React.SetStateAction<ShoppingPriceSession>>;
  onBack: () => void;
}) {
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'KRW'];
  const fromCurrency = 'CNY';
  const [ratesResult, setRatesResult] = useState<ExchangeRatesResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const controller = new AbortController();

    async function loadRates() {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/exchange-rates?base=${encodeURIComponent(fromCurrency)}`, {
          signal: controller.signal,
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(body?.error || 'We could not load exchange rates.');
        }
        setRatesResult(body as ExchangeRatesResult);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(requestError instanceof Error ? requestError.message : 'We could not load exchange rates.');
      } finally {
        setIsLoading(false);
      }
    }

    loadRates();
    return () => controller.abort();
  }, []);

  const rate = ratesResult?.rates[session.toCurrency] ?? 0;
  const numericAmount = Number(session.amount || 0);
  const converted = rate ? numericAmount * rate : 0;
  const result = formatCurrencyAmount(converted, session.toCurrency);
  const cnyAmount = formatCurrencyAmount(numericAmount, 'CNY');

  function updateAmount(value: string) {
    onSessionChange((current) => ({ ...current, amount: value }));
  }

  function updateTargetCurrency(value: string) {
    onSessionChange((current) => ({ ...current, toCurrency: value }));
  }

  function checkPrice() {
    onSessionChange((current) => ({ ...current, hasChecked: true }));
  }

  return (
    <section className="screen understand-menu-screen shopping-price-screen">
      <header className="understand-menu-header">
        <button className="icon-button restaurant-back-button" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button>
        <p>Shopping</p>
        <h1>Check a Price</h1>
        <span>How much am I actually paying?</span>
      </header>

      <section className="explore-dish-form shopping-price-form">
        <label className="text-field explore-dish-field">
          <span>Price in China</span>
          <div className="shopping-price-input-row">
            <strong>¥</strong>
            <input inputMode="decimal" value={session.amount} onChange={(event) => updateAmount(event.target.value)} placeholder="39.9" />
          </div>
        </label>
        <label className="text-field explore-dish-field compact-field"><span>Show me in</span><select value={session.toCurrency} onChange={(event) => updateTargetCurrency(event.target.value)}>{currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></label>
        <button className="menu-understand-button shopping-price-check-button" type="button" onClick={checkPrice}>Check Price</button>
      </section>

      {error ? <div className="error-panel menu-error-panel"><strong>Exchange rates unavailable</strong><p>{error}</p></div> : null}
      {session.hasChecked ? (
        <div className="menu-result-header shopping-rate-card">
          <span className="badge">Indicative rate</span>
          <p className="shopping-cny-amount">{cnyAmount}</p>
          <h2>{isLoading ? 'Loading...' : result}</h2>
          <p>{ratesResult?.updatedAt ? `Last updated ${ratesResult.updatedAt}` : 'Loading latest rate...'}</p>
          <small>Exchange rates are for quick travel reference only. Not a guaranteed checkout price.</small>
        </div>
      ) : null}
    </section>
  );
}

function formatCurrencyAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: ['JPY', 'KRW'].includes(currency) ? 0 : 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function CurrencyConverterPage({ onBack }: { onBack: () => void }) {
  const [amount, setAmount] = useState('100');
  const [direction, setDirection] = useState('cny-to-usd');
  const rates: Record<string, { label: string; rate: number; prefix: string }> = {
    'cny-to-usd': { label: 'CNY -> USD', rate: 0.14, prefix: '$' },
    'usd-to-cny': { label: 'USD -> CNY', rate: 7.2, prefix: 'RMB ' },
    'cny-to-eur': { label: 'CNY -> EUR', rate: 0.13, prefix: 'EUR ' },
    'eur-to-cny': { label: 'EUR -> CNY', rate: 7.8, prefix: 'RMB ' },
    'cny-to-gbp': { label: 'CNY -> GBP', rate: 0.11, prefix: 'GBP ' },
    'gbp-to-cny': { label: 'GBP -> CNY', rate: 9.1, prefix: 'RMB ' },
    'cny-to-jpy': { label: 'CNY -> JPY', rate: 22, prefix: 'JPY ' },
    'jpy-to-cny': { label: 'JPY -> CNY', rate: 0.045, prefix: 'RMB ' },
  };
  const selected = rates[direction];
  const result = (Number(amount || 0) * selected.rate).toFixed(2);
  return (
    <section className="screen">
      <PageHeader title="Currency Converter" description="Prototype / Indicative rate" onBack={onBack} />
      <WarningCard text="This prototype uses fixed mock rates. It is not real-time financial data." />
      <label className="text-field"><span>Amount</span><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
      <label className="text-field compact-field"><span>Currency</span><select value={direction} onChange={(event) => setDirection(event.target.value)}>{Object.entries(rates).map(([key, rate]) => <option key={key} value={key}>{rate.label}</option>)}</select></label>
      <div className="result-card"><span>{selected.label}</span><strong>{selected.prefix}{result}</strong><p>Indicative only</p></div>
    </section>
  );
}

function EmergencyPage({
  onBack,
  onAskLocal,
  onShowChinese,
}: {
  onBack: () => void;
  onAskLocal: () => void;
  onShowChinese: (service: EmergencyService) => void;
}) {
  const [pendingCall, setPendingCall] = useState<EmergencyService | null>(null);

  function callEmergency(service: EmergencyService) {
    window.location.href = `tel:${service.number}`;
  }

  return (
    <section className="screen emergency-screen">
      <div className="module-hero emergency-hero">
        <button className="back-bubble" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={27} /></button>
        <span className="module-kicker">Emergency</span>
        <h1>Call the right number, fast.</h1>
        <p>Mainland China emergency numbers.</p>
      </div>
      <div className="emergency-call-list">
        {emergencyServices.map((service) => (
          <EmergencyDialCard
            service={service}
            key={service.id}
            onCall={() => setPendingCall(service)}
            onShowChinese={() => onShowChinese(service)}
          />
        ))}
      </div>
      <p className="emergency-footnote">This opens your device's phone app. Orienta does not contact emergency services for you.</p>
      <button className="emergency-ask-local-link" type="button" onClick={onAskLocal}>Not an emergency? Ask a Local instead.</button>

      {pendingCall ? (
        <CallConfirmDialog
          service={pendingCall}
          onCancel={() => setPendingCall(null)}
          onConfirm={() => callEmergency(pendingCall)}
        />
      ) : null}
    </section>
  );
}

function EmergencyDialCard({
  service,
  onCall,
  onShowChinese,
}: {
  service: EmergencyService;
  onCall: () => void;
  onShowChinese: () => void;
}) {
  return (
    <article className="emergency-dial-card">
      <div className="emergency-dial-icon">{service.icon}</div>
      <div className="emergency-dial-copy">
        <h2>{service.name}</h2>
        <strong>{service.number}</strong>
        <p>{service.description}</p>
      </div>
      <div className="emergency-card-actions">
        <button className="primary-button emergency-call-button" type="button" onClick={onCall}>Call {service.number}</button>
        <button className="secondary-button emergency-show-button" type="button" onClick={onShowChinese}>Show Chinese</button>
      </div>
    </article>
  );
}

function CallConfirmDialog({
  service,
  onCancel,
  onConfirm,
}: {
  service: EmergencyService;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="call-confirm-title">
      <div className="call-confirm-dialog">
        <h2 id="call-confirm-title">Call {service.name}?</h2>
        <p>This will open your phone app and call {service.number}.</p>
        <div className="display-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" type="button" onClick={onConfirm}>Call</button>
        </div>
      </div>
    </div>
  );
}

function Detail({ title, body }: { title: string; body: string }) {
  return <section className="detail-card"><h2>{title}</h2><p>{body}</p></section>;
}

function WarningCard({ text }: { text: string }) {
  return <div className="warning-card"><AlertTriangle size={18} aria-hidden="true" /><p>{text}</p></div>;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function AskLocalPage({
  onBack,
  onCreated,
  onEmergency,
}: {
  onBack: () => void;
  onCreated: (token: string, email: string) => void;
  onEmergency: () => void;
}) {
  const [question, setQuestion] = useState('');
  const [location, setLocation] = useState('');
  const [context, setContext] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const canSubmit = question.trim().length > 0 && isValidEmail(email) && !isSubmitting;

  React.useEffect(() => {
    try {
      const draft = window.localStorage.getItem(askLocalDraftStorageKey);
      if (!draft) return;
      const parsed = JSON.parse(draft) as { question?: string; location?: string; context?: string; email?: string };
      setQuestion(parsed.question ?? '');
      setLocation(parsed.location ?? '');
      setContext(parsed.context ?? '');
      setEmail(parsed.email ?? '');
    } catch {
      window.localStorage.removeItem(askLocalDraftStorageKey);
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(askLocalDraftStorageKey, JSON.stringify({ question, location, context, email }));
  }, [question, location, context, email]);

  async function submitQuestion() {
    if (isSubmitting) return;
    if (!question.trim()) {
      setError('Please enter your question.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address so we can send your reply.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('question', question.trim());
      formData.append('location', location.trim());
      formData.append('context', context.trim());
      formData.append('email', email.trim());
      if (photo) formData.append('photo', photo);

      const response = await fetch('/api/local-questions', {
        method: 'POST',
        body: formData,
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error || 'We could not submit your question.');
      }

      window.localStorage.removeItem(askLocalDraftStorageKey);
      window.sessionStorage.setItem(askLocalSubmittedStorageKey, JSON.stringify({ token: body.privateToken, email: email.trim() }));
      onCreated(body.privateToken, email.trim());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not submit your question.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="screen ask-local-screen">
      <div className="module-hero ask-local-hero">
        <button className="back-bubble" type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={27} /></button>
        <span className="module-kicker">Ask a Local</span>
        <h1>Ask someone who knows China.</h1>
        <p>Get a private answer by email.</p>
      </div>

      <section className="ask-local-card">
        <p className="ask-local-card-note">When travel tools aren't enough, a real person will review your question.</p>
        <label className="text-field ask-local-field">
          <span>What do you need help with?</span>
          <textarea placeholder="e.g. Which entrance should I use at this station?" value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <label className="text-field compact-field ask-local-field">
          <span>Email address</span>
          <input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <small>We'll send the answer to this email. Your email is only used to reply to this question.</small>
        </label>

        <label className="ask-local-photo-dropzone">
          <Plus size={24} aria-hidden="true" />
          <strong>Add a photo</strong>
          <small>Sign, menu, ticket or screenshot · Optional</small>
          <input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
        </label>
        {photo ? <p className="prototype-note ask-local-photo-name">{photo.name}</p> : null}
        <small className="ask-local-privacy-note">Don't upload passwords, payment codes or full ID documents.</small>

        <button className="ask-local-optional-toggle" type="button" onClick={() => setShowOptionalDetails((value) => !value)}>
          <span>Add location or more details</span>
          <small>{showOptionalDetails ? 'Hide' : 'Optional'}</small>
        </button>
        {showOptionalDetails ? (
          <div className="ask-local-optional-fields">
            <label className="text-field compact-field ask-local-field">
              <span>Current city</span>
              <input type="text" placeholder="Qingdao, Beijing South Station..." value={location} onChange={(event) => setLocation(event.target.value)} />
            </label>
            <label className="text-field ask-local-field">
              <span>Context / details</span>
              <textarea placeholder="Add anything that may help us understand the situation." value={context} onChange={(event) => setContext(event.target.value)} />
            </label>
          </div>
        ) : null}
      </section>

      {error ? <div className="error-panel"><strong>Submission failed</strong><p>{error}</p></div> : null}
      <button className="primary-button footer-button ask-local-submit" type="button" disabled={!canSubmit} onClick={submitQuestion}>{isSubmitting ? 'Sending...' : 'Send to a Local'}</button>
      <button className="ask-local-emergency-note" type="button" onClick={onEmergency}>
        <AlertTriangle size={18} aria-hidden="true" />
        <span>For urgent situations, open Emergency.</span>
      </button>
    </section>
  );
}

function QuestionDetailPage({ token, onHome }: { token: string; onHome: () => void }) {
  const [question, setQuestion] = useState<TravelerQuestion | null>(null);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const link = `${window.location.origin}/questions/${token}`;

  React.useEffect(() => {
    async function loadQuestion() {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/questions/${encodeURIComponent(token)}`);
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || 'Question not found.');
        setQuestion(body as TravelerQuestion);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Question not found.');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) loadQuestion();
  }, [token]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setStatusMessage('Private link copied.');
    } catch {
      setStatusMessage('Copy is not available on this device.');
    }
  }

  async function shareLink() {
    const browserNavigator = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    try {
      if (browserNavigator.share) {
        await browserNavigator.share({ title: 'Ask a Local question', text: link });
        return;
      }
      await copyLink();
    } catch {
      setStatusMessage('Share is not available on this device.');
    }
  }

  if (isLoading) return <section className="screen"><PageHeader title="Ask a Local" onBack={onHome} /><div className="menu-loading"><div className="spinner" /><p>Loading question...</p></div></section>;
  if (error || !question) return <section className="screen"><PageHeader title="Question not found" onBack={onHome} /><div className="error-panel"><strong>Invalid private link</strong><p>This question could not be found.</p></div></section>;

  return (
    <section className="screen ask-local-screen">
      <div className="module-hero ask-local-hero compact">
        <button className="back-bubble" type="button" onClick={onHome} aria-label="Back"><ArrowLeft size={27} /></button>
        <span className="module-kicker">Ask a Local</span>
        <h1>Your question</h1>
        <p>{getTravelerQuestionStatus(question)}</p>
      </div>
      <section className="ask-local-status-card">
        <span className="badge">{getTravelerQuestionStatus(question)}</span>
        <h2>{question.status === 'answered' ? 'Answered' : 'Question received'}</h2>
        <p>{question.status === 'answered' ? 'The answer was also sent by email when it was published.' : "We'll email you when the answer is ready. This page is only a backup."}</p>
      </section>
      <div className="detail-list ask-local-detail-list">
        <Detail title="Submitted question" body={question.question} />
        {question.location ? <Detail title="Current city" body={question.location} /> : null}
        {question.context ? <Detail title="Context" body={question.context} /> : null}
        <Detail title="Submitted" body={formatDateTime(question.createdAt)} />
      </div>
      {question.hasPhoto ? <img className="question-photo" src={`/api/questions/${encodeURIComponent(token)}/photo`} alt="Uploaded question context" /> : null}
      {question.replyEnglish ? (
        <section className="answer-card">
          <span className="badge">Answered by a local</span>
          <p>{question.replyEnglish}</p>
          {question.usefulChinese ? <p className="large-chinese-name">{question.usefulChinese}</p> : null}
        </section>
      ) : (
        <div className="empty-preview"><MessageCircle size={34} aria-hidden="true" /><p>Answer in progress. This is not an instant chat, so you can safely leave this page.</p></div>
      )}
      <div className="display-actions">
        <button className="secondary-button" type="button" onClick={copyLink}>Copy Link</button>
        <button className="secondary-button" type="button" onClick={shareLink}>Share Link</button>
        {statusMessage ? <p className="prototype-note" role="status">{statusMessage}</p> : null}
      </div>
    </section>
  );
}

function AdminLoginPage({ onLoggedIn, onHome }: { onLoggedIn: () => void; onHome: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function login() {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'Admin login failed.');
      onLoggedIn();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Admin login failed.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="screen">
      <PageHeader title="Admin Login" description="Ask a Local" onBack={onHome} />
      <label className="text-field"><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="text-field compact-field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {error ? <div className="error-panel"><strong>Login failed</strong><p>{error}</p></div> : null}
      <button className="primary-button footer-button" type="button" disabled={!email || !password || isLoading} onClick={login}>{isLoading ? 'Logging in...' : 'Log In'}</button>
    </section>
  );
}

function AdminQuestionsPage({ onHome, onOpen, onLogin }: { onHome: () => void; onOpen: (id: number) => void; onLogin: () => void }) {
  const [status, setStatus] = useState('new');
  const [questions, setQuestions] = useState<AdminQuestionSummary[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/questions?status=${status}`);
        if (response.status === 401) {
          onLogin();
          return;
        }
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || 'Could not load questions.');
        setQuestions(body.questions ?? []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Could not load questions.');
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [status, onLogin]);

  return (
    <section className="screen">
      <PageHeader title="Admin Questions" description="Ask a Local" onBack={onHome} />
      <div className="example-row">{['new', 'answered', 'closed', 'all'].map((item) => <button className={`choice-pill ${status === item ? 'selected' : ''}`} type="button" key={item} onClick={() => setStatus(item)}>{item}</button>)}</div>
      {isLoading ? <div className="menu-loading"><div className="spinner" /><p>Loading questions...</p></div> : null}
      {error ? <div className="error-panel"><strong>Could not load questions</strong><p>{error}</p></div> : null}
      {!isLoading && !questions.length ? <div className="empty-preview"><MessageCircle size={34} aria-hidden="true" /><p>No questions here.</p></div> : null}
      <div className="card-list tool-list">
        {questions.map((item) => (
          <button className="scenario-card" type="button" key={item.id} onClick={() => onOpen(item.id)}>
            <span className="scenario-icon"><MessageCircle size={24} aria-hidden="true" /></span>
            <span>
              <strong>{item.status}{item.hasPhoto ? <em>Photo</em> : null}</strong>
              <small>{item.question.slice(0, 96)}{item.question.length > 96 ? '...' : ''}<br />{item.location || 'No city'}<br />Reply email: {formatDeliveryStatus(item.emailStatus)}<br />Submitted {formatDateTime(item.createdAt)}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function AdminQuestionDetailPage({ id, onBack, onLogin }: { id: number; onBack: () => void; onLogin: () => void }) {
  const [question, setQuestion] = useState<AdminQuestion | null>(null);
  const [replyEnglish, setReplyEnglish] = useState('');
  const [usefulChinese, setUsefulChinese] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  React.useEffect(() => {
    async function loadQuestion() {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/admin/questions/${id}`);
        if (response.status === 401) {
          onLogin();
          return;
        }
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || 'Question not found.');
        setQuestion(body as AdminQuestion);
        setReplyEnglish(body.replyEnglish ?? '');
        setUsefulChinese(body.usefulChinese ?? '');
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Question not found.');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) loadQuestion();
  }, [id, onLogin]);

  async function updateQuestion(action: 'draft' | 'publish' | 'close') {
    setMessage('');
    setError('');
    if (action === 'publish') setIsPublishing(true);
    try {
      const response = await fetch(`/api/admin/questions/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'close' ? '{}' : JSON.stringify({ replyEnglish, usefulChinese }),
      });
      if (response.status === 401) {
        onLogin();
        return;
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'Could not update question.');
      const update = unwrapAdminQuestionResponse(body as AdminQuestionUpdateResponse);
      setQuestion(update.question);
      setMessage(update.emailDeliveryMessage || (action === 'publish' ? 'Reply published.' : action === 'close' ? 'Question closed.' : 'Draft saved.'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update question.');
    } finally {
      if (action === 'publish') setIsPublishing(false);
    }
  }

  async function sendEmail() {
    setMessage('');
    setError('');
    setIsSendingEmail(true);
    try {
      const response = await fetch(`/api/admin/questions/${id}/email`, {
        method: 'POST',
      });
      if (response.status === 401) {
        onLogin();
        return;
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || 'Could not send email.');
      const update = unwrapAdminQuestionResponse(body as AdminQuestionUpdateResponse);
      setQuestion(update.question);
      setMessage(update.emailDeliveryMessage || 'Email sent.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send email.');
    } finally {
      setIsSendingEmail(false);
    }
  }

  if (isLoading) return <section className="screen"><PageHeader title="Question" onBack={onBack} /><div className="menu-loading"><div className="spinner" /><p>Loading question...</p></div></section>;
  if (error && !question) return <section className="screen"><PageHeader title="Question" onBack={onBack} /><div className="error-panel"><strong>Could not open question</strong><p>{error}</p></div></section>;
  if (!question) return null;

  return (
    <section className="screen">
      <PageHeader title="Question Detail" description={question.status} onBack={onBack} />
      <div className="detail-list">
        <Detail title="Question" body={question.question} />
        {question.location ? <Detail title="Location" body={question.location} /> : null}
        {question.context ? <Detail title="Context" body={question.context} /> : null}
        {question.email ? <Detail title="Email" body={question.email} /> : null}
        <Detail title="Reply status" body={question.answerStatus} />
        <Detail title="Email delivery" body={formatEmailDelivery(question)} />
        <Detail title="Last attempted" body={question.emailAttemptedAt ? formatDateTime(question.emailAttemptedAt) : 'Not attempted'} />
        <Detail title="Sent at" body={question.emailSentAt ? formatDateTime(question.emailSentAt) : 'Not sent'} />
        <Detail title="Provider message ID" body={question.emailProviderMessageId || 'None'} />
        <Detail title="Retry count" body={String(question.emailRetryCount ?? 0)} />
        {question.emailError ? <Detail title="Last error" body={question.emailError} /> : null}
        <Detail title="Admin notification" body={formatAdminNotificationStatus(question)} />
        <Detail title="Admin notification attempted" body={question.adminNotificationAttemptedAt ? formatDateTime(question.adminNotificationAttemptedAt) : 'Not attempted'} />
        <Detail title="Admin notification message ID" body={question.adminNotificationProviderMessageId || 'None'} />
        <Detail title="Submitted" body={formatDateTime(question.createdAt)} />
      </div>
      {question.hasPhoto ? <img className="question-photo" src={`/api/admin/questions/${question.id}/photo`} alt="Uploaded question context" /> : null}
      <label className="text-field compact-field"><span>Reply in English</span><textarea value={replyEnglish} onChange={(event) => setReplyEnglish(event.target.value)} /></label>
      <label className="text-field compact-field"><span>Useful Chinese phrase</span><textarea value={usefulChinese} onChange={(event) => setUsefulChinese(event.target.value)} /></label>
      {error ? <div className="error-panel"><strong>Update failed</strong><p>{error}</p></div> : null}
      {message ? <p className="prototype-note">{message}</p> : null}
      <div className="display-actions">
        <button className="secondary-button" type="button" onClick={() => updateQuestion('draft')}>Save Draft</button>
        <button className="primary-button" type="button" disabled={!replyEnglish.trim() || isPublishing} onClick={() => updateQuestion('publish')}>{isPublishing ? 'Publishing...' : 'Publish Reply'}</button>
        {question.answerStatus === 'published' ? <button className="secondary-button" type="button" disabled={isSendingEmail} onClick={sendEmail}>{isSendingEmail ? 'Sending...' : shouldLabelRetry(question.emailStatus) ? 'Retry Email' : 'Resend Email'}</button> : null}
        <button className="secondary-button" type="button" onClick={() => updateQuestion('close')}>Mark as Closed</button>
      </div>
    </section>
  );
}

function unwrapAdminQuestionResponse(body: AdminQuestionUpdateResponse): { question: AdminQuestion; emailDeliveryMessage: string } {
  const possibleWrappedQuestion = (body as { question?: unknown }).question;
  if (typeof possibleWrappedQuestion === 'object' && possibleWrappedQuestion !== null) {
    const wrapped = body as { question: AdminQuestion; emailDeliveryMessage?: string };
    return { question: wrapped.question, emailDeliveryMessage: wrapped.emailDeliveryMessage ?? '' };
  }

  return { question: body as AdminQuestion, emailDeliveryMessage: '' };
}

function formatEmailDelivery(question: AdminQuestion) {
  if (question.emailStatus === 'sent') {
    return `Email sent${question.emailProvider ? ` via ${question.emailProvider}` : ''}`;
  }

  if (question.emailStatus === 'failed') {
    return `Failed${question.emailError ? `: ${question.emailError}` : ''}`;
  }

  if (question.emailStatus === 'development_logged') {
    return 'Development only - no email sent';
  }

  if (question.emailStatus === 'not_configured') {
    return 'Email service not configured';
  }

  return 'Not sent';
}

function shouldLabelRetry(status: AdminQuestion['emailStatus']) {
  return status === 'failed' || status === 'development_logged' || status === 'not_configured';
}

function formatDeliveryStatus(status: AdminQuestionSummary['emailStatus']) {
  const labels: Record<AdminQuestionSummary['emailStatus'], string> = {
    pending: 'Not sent',
    sent: 'Email sent',
    failed: 'Email failed',
    development_logged: 'Development only',
    not_configured: 'Not configured',
  };
  return labels[status] ?? 'Not sent';
}

function formatAdminNotificationStatus(question: AdminQuestion) {
  if (question.adminNotificationStatus === 'sent') {
    return `Sent${question.adminNotificationSentAt ? ` at ${formatDateTime(question.adminNotificationSentAt)}` : ''}`;
  }

  if (question.adminNotificationStatus === 'failed') {
    return `Failed${question.adminNotificationError ? `: ${question.adminNotificationError}` : ''}`;
  }

  if (question.adminNotificationStatus === 'development_logged') return 'Development only - no email sent';
  if (question.adminNotificationStatus === 'not_configured') return 'Admin notification email not configured';
  return 'Pending';
}

function getTravelerQuestionStatus(question: TravelerQuestion) {
  if (question.status === 'answered') return 'Answered';
  if (question.status === 'closed') return 'Closed';
  return 'Answer in progress';
}

function formatDateTime(value: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function SubmittedPage({
  email,
  privateToken,
  onBack,
  onHome,
  onOpenPrivateLink,
}: {
  email: string;
  privateToken: string;
  onBack: () => void;
  onHome: () => void;
  onOpenPrivateLink: () => void;
}) {
  return (
    <section className="screen submitted-screen ask-local-screen">
      <div className="submitted-card ask-local-success-card">
        <MessageCircle size={34} aria-hidden="true" />
        <h1>Your question is on its way.</h1>
        <p>A real person will review it and send the answer to {email || 'your email'}.</p>
        <small>This is not an instant chat. You can safely leave this page.</small>
      </div>
      <section className="ask-local-backup-link">
        <strong>Private backup link</strong>
        <p>Keep this private link if you want to check the answer later.</p>
        <button className="secondary-button" type="button" disabled={!privateToken} onClick={onOpenPrivateLink}>Open Private Page</button>
      </section>
      <div className="display-actions"><button className="primary-button" type="button" onClick={onBack}>Ask Another Question</button><button className="secondary-button" type="button" onClick={onHome}>Back Home</button></div>
    </section>
  );
}

function ChineseDisplayCard({ context, onBack, onDone }: { context: DisplayContext; onBack: () => void; onDone?: () => void }) {
  const [showBigText, setShowBigText] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const showLabel = context.showLabel ?? `Show to ${context.audience}`;
  const copyLabel = context.copyLabel ?? 'Copy Chinese';
  const isRestaurantStaffCard = context.audience === 'Staff' || context.audience === 'Shop Staff';
  const isEmergencyCard = context.phrase.category === 'emergency';
  const isQuickPhraseCard = context.returnPage === 'quick-phrases';

  function playChineseAudio() {
    if (!('speechSynthesis' in window)) {
      setStatusMessage('Audio is prototype only on this device.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(context.phrase.chinese);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.86;
    window.speechSynthesis.speak(utterance);
    setStatusMessage('');
  }

  async function copyChinese() {
    try {
      await navigator.clipboard.writeText(context.phrase.chinese);
      setStatusMessage(copyLabel === 'Copy Address' ? 'Address copied.' : 'Chinese copied.');
    } catch {
      setStatusMessage('Copy is not available on this device.');
    }
  }

  if (showBigText) {
    return <section className="staff-mode" aria-label={showLabel}><div><p className="staff-chinese">{context.phrase.chinese}</p><p className="staff-english">{context.phrase.english}</p></div><button type="button" onClick={() => setShowBigText(false)}>Done</button></section>;
  }

  return (
    <section className={`screen display-screen ${isRestaurantStaffCard ? 'restaurant-display-screen' : ''} ${isEmergencyCard ? 'emergency-display-screen' : ''} ${isQuickPhraseCard ? 'quick-display-screen' : ''}`}>
      <header className="top-bar"><button className={`icon-button ${isRestaurantStaffCard ? 'restaurant-back-button' : ''}`} type="button" onClick={onBack} aria-label="Back"><ArrowLeft size={21} aria-hidden="true" /></button></header>
      <div className={isRestaurantStaffCard ? 'menu-order-card phrase-display-card' : 'display-card'}><p className="english-line">{context.phrase.english}</p><p className="chinese-line">{context.phrase.chinese}</p></div>
      <div className={`display-actions ${isRestaurantStaffCard ? 'restaurant-display-actions' : ''} ${isEmergencyCard ? 'emergency-display-actions' : ''} ${isQuickPhraseCard ? 'quick-display-actions' : ''}`}>
        <button className="primary-button" type="button" onClick={() => setShowBigText(true)}>{showLabel}</button>
        <button className="secondary-button" type="button" onClick={playChineseAudio}><Volume2 size={19} aria-hidden="true" />Play Chinese Audio</button>
        <button className="secondary-button" type="button" onClick={copyChinese}><Copy size={19} aria-hidden="true" />{copyLabel}</button>
        {onDone ? <button className="secondary-button" type="button" onClick={onDone}>Done</button> : null}
      </div>
      {statusMessage ? <p className="prototype-note">{statusMessage}</p> : null}
    </section>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
