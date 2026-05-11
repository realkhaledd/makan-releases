import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import SmtpSettingsView       from './SmtpSettingsView.jsx';
import BulkMailView           from './BulkMailView.jsx';
import WhatsAppCampaignView   from './WhatsAppCampaignView.jsx';
import ToolsView, { NotesStandaloneView } from './ToolsView.jsx';
import MarketingView from './MarketingView.jsx';
import SuperAdminView  from './SuperAdminView.jsx';
import './App.css';
import { db, IS_CONFIGURED, storage, auth } from './firebase.js';
import { signInAnonymously } from 'firebase/auth';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection, doc, onSnapshot,
  setDoc, updateDoc, deleteDoc, getDocs,
} from 'firebase/firestore';
import {
  Search, Home, MapPin, DollarSign, BedDouble, Percent, CheckCircle2,
  AlertCircle, Database, Plus, Trash2, RefreshCw, UploadCloud, FileText,
  Check, Globe, LogOut, User, Building2, Users, Eye, EyeOff, Shield,
  TrendingUp, BarChart3, Clock, Star, Filter, ChevronDown, ChevronUp,
  Award, Zap, Target, Activity, Bell, Settings, X, Menu, ArrowRight,
  ExternalLink, Copyright, Hash, Bookmark, BookmarkCheck, Printer, Mail,
  Network, Phone, Download, GitBranch, Kanban, MessageSquare, Bot,
  ChevronLeft, ChevronRight, Send, Sparkles, ClipboardList, ToggleLeft,
  ToggleRight, Play, Pause, Copy, CheckSquare, Grid, MessageCircle, Calculator, StickyNote, Megaphone
} from 'lucide-react';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const PRIMARY = '#4F46E5'; // Indigo — primary action colour

const GLASS = {
  background:              'rgba(255,255,255,0.45)',
  backdropFilter:          'blur(24px) saturate(180%)',
  WebkitBackdropFilter:    'blur(24px) saturate(180%)',
  border:                  '1px solid rgba(255,255,255,0.60)',
  borderRadius:            24,
  boxShadow:               '0 8px 32px rgba(99,102,241,0.07), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)',
};

// RTL-aware X-offset: flips the sign of a shadow's horizontal offset when in RTL mode.
// Usage: `${sx(-20, rtl)}px 0 30px rgba(0,0,0,0.1)` → positive in RTL, negative in LTR.
const sx = (x, rtl) => rtl ? -x : x;

// ─── LANGUAGES ────────────────────────────────────────────────────────────────
const LANGS = [
  { id:'ar', name:'العربية',  flag:'🇦🇪', dir:'rtl' },
  { id:'ur', name:'اردو',     flag:'🇵🇰', dir:'rtl' },
  { id:'en', name:'English',  flag:'🇺🇸', dir:'ltr' },
  { id:'ru', name:'Русский',  flag:'🇷🇺', dir:'ltr' },
  { id:'zh', name:'中文',      flag:'🇨🇳', dir:'ltr' },
  { id:'hi', name:'हिन्दी',    flag:'🇮🇳', dir:'ltr' },
];

// Translation dictionary keyed by English string
const TRANS = {
  ur: {
    'Dashboard':'ڈیش بورڈ','Manage Units':'یونٹس','Match Engine':'میچ انجن',
    'Shortlist':'شارٹ لسٹ','Team Overview':'ٹیم','Users & Roles':'صارفین',
    'Org Chart':'تنظیمی ڈھانچہ','Leads CRM':'لیڈز','Sales Requests':'فروخت درخواستیں',
    'Automations':'آٹومیشن','AI Assistant':'AI معاون','Bulk Mail':'بلک میل',
    'SMTP Settings':'SMTP','Support':'سپورٹ','Instagram':'انسٹاگرام',
    'Add':'شامل کریں','Cancel':'منسوخ','Save':'محفوظ','Delete':'حذف',
    'Edit':'ترمیم','Search':'تلاش','Filter':'فلٹر','Report':'رپورٹ',
    'Export':'برآمد','Print':'پرنٹ',
    'New Request':'نئی درخواست','Searching':'تلاش جاری','Matched':'مل گیا',
    'Viewing Sched.':'معائنہ','Offer Made':'پیشکش','Closed ✓':'بند ✓','Cancelled':'منسوخ',
    'Phone':'فون','Budget':'بجٹ','Name':'نام','Agent':'ایجنٹ',
    'Location':'مقام','Beds':'کمرے','Notes':'نوٹس','Stage':'مرحلہ',
    'Type':'نوع','Assign Agent':'ایجنٹ مقرر','Add Request':'درخواست شامل',
    'Client Name *':'کلائنٹ نام *','Full Name':'پورا نام','Bedrooms':'کمرے',
    'Unassigned':'غیر مقرر','All Locations':'تمام مقامات',
    'Synced':'متزامن','Connecting':'کنیکٹ','Logout':'لاگ آؤٹ',
    'Add Rule':'قاعدہ شامل','Rule Name':'قاعدہ نام',
    'Trigger':'ٹرگر','Action':'عمل','Duration (hours)':'مدت (گھنٹے)',
    'No automation rules yet':'کوئی قاعدہ نہیں','Enable':'فعال','Pause':'روکیں',
    'Assign to Agent':'ایجنٹ کو سونپیں','Move to Stage':'مرحلے میں منتقل',
    'Notify Manager':'مینیجر کو اطلاع','When new lead added':'نیا لیڈ',
    'Lead unassigned for more than':'غیر مقرر لیڈ','Lead in stage for more than':'مرحلے میں لیڈ',
    'hours':'گھنٹے','Sign In':'لاگ ان','Email':'ای میل','Password':'پاس ورڈ',
    'Integrated Real Estate Management System':'مربوط ریل اسٹیٹ سسٹم',
    'Manage Stages':'مراحل کا انتظام','All Stages':'تمام مراحل',
    'All Agents':'تمام ایجنٹس','Date From':'تاریخ سے','Date To':'تاریخ تک',
    'Kanban':'کانبان','Summary':'خلاصہ','Total':'کل',
    'Background rules run every 5 minutes':'ہر 5 منٹ بعد چلتے ہیں',
    'Add First Rule':'پہلا قاعدہ شامل کریں','Add New Rule':'نیا قاعدہ شامل',
    'Manage Sales Stages':'فروخت مراحل کا انتظام',
    'Stage Distribution':'مراحل کی تقسیم','Agent Performance':'ایجنٹ کارکردگی',
    'Requests List':'درخواستوں کی فہرست','Total Requests':'کل درخواستیں',
    'Total Budget':'کل بجٹ','Closed':'بند','No requests found':'کوئی درخواست نہیں',
    'System Admin':'سسٹم ایڈمن',
  },
  ru: {
    'Dashboard':'Панель','Manage Units':'Объекты','Match Engine':'Подбор',
    'Shortlist':'Избранное','Team Overview':'Команда','Users & Roles':'Пользователи',
    'Org Chart':'Структура','Leads CRM':'Лиды','Sales Requests':'Заявки',
    'Automations':'Автоматизация','AI Assistant':'ИИ Помощник','Bulk Mail':'Рассылка',
    'SMTP Settings':'SMTP','Support':'Поддержка','Instagram':'Instagram',
    'Add':'Добавить','Cancel':'Отмена','Save':'Сохранить','Delete':'Удалить',
    'Edit':'Редактировать','Search':'Поиск','Filter':'Фильтр','Report':'Отчёт',
    'Export':'Экспорт','Print':'Печать',
    'New Request':'Новая заявка','Searching':'Поиск','Matched':'Совпадение',
    'Viewing Sched.':'Просмотр','Offer Made':'Предложение','Closed ✓':'Закрыто ✓','Cancelled':'Отменено',
    'Phone':'Телефон','Budget':'Бюджет','Name':'Имя','Agent':'Агент',
    'Location':'Район','Beds':'Комнат','Notes':'Заметки','Stage':'Этап',
    'Type':'Тип','Assign Agent':'Назначить агента','Add Request':'Добавить заявку',
    'Client Name *':'Имя клиента *','Full Name':'Полное имя','Bedrooms':'Комнат',
    'Unassigned':'Не назначено','All Locations':'Все районы',
    'Synced':'Синхронизировано','Connecting':'Подключение','Logout':'Выход',
    'Add Rule':'Добавить правило','Rule Name':'Название правила',
    'Trigger':'Триггер','Action':'Действие','Duration (hours)':'Длит. (ч)',
    'No automation rules yet':'Нет правил автоматизации','Enable':'Включить','Pause':'Пауза',
    'Assign to Agent':'Назначить агента','Move to Stage':'На этап',
    'Notify Manager':'Уведомить менеджера','When new lead added':'Новый лид',
    'Lead unassigned for more than':'Лид без агента более','Lead in stage for more than':'Лид на этапе более',
    'hours':'ч','Sign In':'Войти','Email':'Email','Password':'Пароль',
    'Integrated Real Estate Management System':'Система управления недвижимостью',
    'Manage Stages':'Управление этапами','All Stages':'Все этапы',
    'All Agents':'Все агенты','Date From':'С даты','Date To':'По дату',
    'Kanban':'Канбан','Summary':'Итог','Total':'Всего',
    'Background rules run every 5 minutes':'Правила каждые 5 минут',
    'Add First Rule':'Добавить первое правило','Add New Rule':'Добавить правило',
    'Manage Sales Stages':'Управление этапами продаж',
    'Stage Distribution':'Распределение по этапам','Agent Performance':'Эффективность агентов',
    'Requests List':'Список заявок','Total Requests':'Всего заявок',
    'Total Budget':'Общий бюджет','Closed':'Закрыто','No requests found':'Заявок не найдено',
    'System Admin':'Системный администратор',
  },
  zh: {
    'Dashboard':'仪表板','Manage Units':'管理单位','Match Engine':'匹配引擎',
    'Shortlist':'收藏夹','Team Overview':'团队概览','Users & Roles':'用户角色',
    'Org Chart':'组织架构','Leads CRM':'线索','Sales Requests':'销售请求',
    'Automations':'自动化','AI Assistant':'AI助手','Bulk Mail':'批量邮件',
    'SMTP Settings':'邮件设置','Support':'支持','Instagram':'Instagram',
    'Add':'添加','Cancel':'取消','Save':'保存','Delete':'删除',
    'Edit':'编辑','Search':'搜索','Filter':'筛选','Report':'报告',
    'Export':'导出','Print':'打印',
    'New Request':'新请求','Searching':'搜索中','Matched':'已匹配',
    'Viewing Sched.':'看房预约','Offer Made':'已出价','Closed ✓':'已关闭 ✓','Cancelled':'已取消',
    'Phone':'电话','Budget':'预算','Name':'姓名','Agent':'经纪人',
    'Location':'位置','Beds':'卧室','Notes':'备注','Stage':'阶段',
    'Type':'类型','Assign Agent':'分配经纪人','Add Request':'添加请求',
    'Client Name *':'客户名称 *','Full Name':'全名','Bedrooms':'卧室数',
    'Unassigned':'未分配','All Locations':'所有位置',
    'Synced':'已同步','Connecting':'连接中','Logout':'退出',
    'Add Rule':'添加规则','Rule Name':'规则名称',
    'Trigger':'触发条件','Action':'执行动作','Duration (hours)':'持续时间(小时)',
    'No automation rules yet':'暂无自动化规则','Enable':'启用','Pause':'暂停',
    'Assign to Agent':'分配给经纪人','Move to Stage':'移动到阶段',
    'Notify Manager':'通知经理','When new lead added':'新增线索时',
    'Lead unassigned for more than':'线索未分配超过','Lead in stage for more than':'线索在阶段超过',
    'hours':'小时','Sign In':'登录','Email':'邮箱','Password':'密码',
    'Integrated Real Estate Management System':'综合房产管理系统',
    'Manage Stages':'管理阶段','All Stages':'所有阶段',
    'All Agents':'所有经纪人','Date From':'开始日期','Date To':'结束日期',
    'Kanban':'看板','Summary':'摘要','Total':'总计',
    'Background rules run every 5 minutes':'每5分钟运行一次',
    'Add First Rule':'添加第一条规则','Add New Rule':'添加新规则',
    'Manage Sales Stages':'管理销售阶段',
    'Stage Distribution':'阶段分布','Agent Performance':'经纪人业绩',
    'Requests List':'请求列表','Total Requests':'总请求数',
    'Total Budget':'总预算','Closed':'已关闭','No requests found':'未找到请求',
    'System Admin':'系统管理员',
  },
  hi: {
    'Dashboard':'डैशबोर्ड','Manage Units':'यूनिट प्रबंधन','Match Engine':'मिलान इंजन',
    'Shortlist':'शॉर्टलिस्ट','Team Overview':'टीम अवलोकन','Users & Roles':'उपयोगकर्ता',
    'Org Chart':'संगठन','Leads CRM':'लीड्स','Sales Requests':'बिक्री अनुरोध',
    'Automations':'स्वचालन','AI Assistant':'AI सहायक','Bulk Mail':'बल्क मेल',
    'SMTP Settings':'SMTP सेटिंग','Support':'सहायता','Instagram':'Instagram',
    'Add':'जोड़ें','Cancel':'रद्द','Save':'सहेजें','Delete':'हटाएं',
    'Edit':'संपादन','Search':'खोजें','Filter':'फ़िल्टर','Report':'रिपोर्ट',
    'Export':'निर्यात','Print':'प्रिंट',
    'New Request':'नई अनुरोध','Searching':'खोज रहे हैं','Matched':'मिलान',
    'Viewing Sched.':'देखने का समय','Offer Made':'ऑफर दिया','Closed ✓':'बंद ✓','Cancelled':'रद्द',
    'Phone':'फोन','Budget':'बजट','Name':'नाम','Agent':'एजेंट',
    'Location':'स्थान','Beds':'बेडरूम','Notes':'नोट्स','Stage':'चरण',
    'Type':'प्रकार','Assign Agent':'एजेंट नियुक्त','Add Request':'अनुरोध जोड़ें',
    'Client Name *':'ग्राहक नाम *','Full Name':'पूरा नाम','Bedrooms':'बेडरूम',
    'Unassigned':'अनिर्दिष्ट','All Locations':'सभी स्थान',
    'Synced':'समन्वित','Connecting':'कनेक्ट हो रहा','Logout':'लॉगआउट',
    'Add Rule':'नियम जोड़ें','Rule Name':'नियम नाम',
    'Trigger':'ट्रिगर','Action':'क्रिया','Duration (hours)':'अवधि (घंटे)',
    'No automation rules yet':'कोई नियम नहीं','Enable':'सक्षम','Pause':'रोकें',
    'Assign to Agent':'एजेंट को सौंपें','Move to Stage':'चरण में ले जाएं',
    'Notify Manager':'प्रबंधक को सूचित','When new lead added':'नई लीड जोड़ने पर',
    'Lead unassigned for more than':'लीड असाइन नहीं','Lead in stage for more than':'लीड चरण में',
    'hours':'घंटे','Sign In':'साइन इन','Email':'ईमेल','Password':'पासवर्ड',
    'Integrated Real Estate Management System':'एकीकृत रियल एस्टेट प्रबंधन',
    'Manage Stages':'चरण प्रबंधन','All Stages':'सभी चरण',
    'All Agents':'सभी एजेंट','Date From':'आरंभ दिनांक','Date To':'समाप्ति दिनांक',
    'Kanban':'कानबान','Summary':'सारांश','Total':'कुल',
    'Background rules run every 5 minutes':'हर 5 मिनट में चलने वाले नियम',
    'Add First Rule':'पहला नियम जोड़ें','Add New Rule':'नया नियम जोड़ें',
    'Manage Sales Stages':'बिक्री चरण प्रबंधन',
    'Stage Distribution':'चरण वितरण','Agent Performance':'एजेंट प्रदर्शन',
    'Requests List':'अनुरोध सूची','Total Requests':'कुल अनुरोध',
    'Total Budget':'कुल बजट','Closed':'बंद','No requests found':'कोई अनुरोध नहीं',
    'System Admin':'सिस्टम एडमिन',
  },
};

// ─── USERS (live, persisted to localStorage) ─────────────────────────────────
const SEED_USERS = [
  { id: 'u0', email: 'superadmin@makan.ae', password: 'makan@2026', role: 'superadmin', name: 'Super Admin', nameEn: 'Super Admin', agentId: 'SYS-000', avatar: 'SA' },
  { id: 'u1', email: 'admin@apex.ae',  password: 'Realkhalid2023', role: 'admin',   name: 'REAL KHALED',      nameEn: 'REAL KHALED',      agentId: 'ADM-000', avatar: 'RK' },
  { id: 'u2', email: 'ahmed@apex.ae',  password: 'apex2025',  role: 'listing', name: 'أحمد السيد',    nameEn: 'Ahmed Al-Sayed',   agentId: 'AGT-001', avatar: 'أس' },
  { id: 'u3', email: 'sara@apex.ae',   password: 'apex2025',  role: 'listing', name: 'سارة المطيري',  nameEn: 'Sara Al-Mutairi',  agentId: 'AGT-002', avatar: 'سم' },
  { id: 'u4', email: 'omar@apex.ae',   password: 'apex2025',  role: 'listing', name: 'عمر الرشيد',    nameEn: 'Omar Al-Rashid',   agentId: 'AGT-003', avatar: 'عر' },
  { id: 'u5', email: 'sales1@apex.ae', password: 'apex2025',  role: 'sales',   name: 'نورا الزهراني', nameEn: 'Noura Al-Zahrani', agentId: 'SLS-001', avatar: 'نز' },
  { id: 'u6', email: 'sales2@apex.ae', password: 'apex2025',  role: 'sales',   name: 'كريم فؤاد',     nameEn: 'Karim Fouad',      agentId: 'SLS-002', avatar: 'كف' },
];

// ─── MULTI-TENANT: Agency detection ───────────────────────────────────────────
// Priority: 1) URL param ?agency=xxx  2) subdomain  3) 'default'
function detectAgencyId() {
  // 1. URL parameter: makancore.com/app?agency=makan
  const params = new URLSearchParams(window.location.search);
  const paramAgency = params.get('agency');
  if (paramAgency && /^[a-z0-9-]+$/.test(paramAgency)) return paramAgency;

  // 2. Subdomain: makan.makancore.com
  const host  = window.location.hostname;
  const parts = host.split('.');
  if (host === 'localhost' || host === '127.0.0.1') return 'default';
  if (parts.length >= 3 && parts[0] !== 'app' && parts[0] !== 'www') return parts[0];

  // 3. Default
  return 'default';
}
export const AGENCY_ID = detectAgencyId();

// Firestore helpers — all data lives under agencies/{agencyId}/
const agCol = (name)     => collection(db, 'agencies', AGENCY_ID, name);
const agDoc = (name, id) => doc(db,         'agencies', AGENCY_ID, name, id);

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
// Keys are prefixed with agencyId for full isolation between tenants
const getStorage = (key, fallback = []) => {
  try { const d = localStorage.getItem(`${AGENCY_ID}_${key}`); return d ? JSON.parse(d) : fallback; }
  catch { return fallback; }
};
const setStorage = (key, val) => {
  try { localStorage.setItem(`${AGENCY_ID}_${key}`, JSON.stringify(val)); } catch {}
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_DATA = [
  { id: 'p1', title: 'فيلا فاخرة - السعديات',     titleEn: 'Luxury Villa Saadiyat',        type: 'villa',     price: 5200000, originalPrice: 5000000, premium: 200000, size: 6500, projectName: 'Saadiyat Villas', handover: 'ready',    location: 'saadiyat',     beds: 5, features: ['مسبح خاص', 'إطلالة بحر', 'غرفة سينما'], notes: '', ownerName: '', ownerPhone: '', agentId: 'AGT-001', agentName: 'أحمد السيد',   paymentType: 'cash', status: 'available', createdAt: '2025-03-01T10:00:00Z' },
  { id: 'p2', title: 'شقة عصرية - جزيرة الريم',   titleEn: 'Modern Apt Al Reem Island',    type: 'apartment', price: 1150000, originalPrice: 1100000, premium: 50000,  size: 1200, projectName: 'Reem Tower',      handover: 'ready',    location: 'reem',          beds: 2, features: ['جيم', 'قرب مول'],                          notes: '', ownerName: '', ownerPhone: '', agentId: 'AGT-002', agentName: 'سارة المطيري', paymentType: 'cash', status: 'available', createdAt: '2025-03-05T11:00:00Z' },
  { id: 'p3', title: 'بنتهاوس - الكورنيش',         titleEn: 'Penthouse Corniche',           type: 'penthouse', price: 3800000, originalPrice: 3600000, premium: 200000, size: 4200, projectName: 'Corniche Suites', handover: 'ready',    location: 'corniche',      beds: 4, features: ['إطلالة بانورامية', 'خدمة كونسيرج'],        notes: '', ownerName: '', ownerPhone: '', agentId: 'AGT-001', agentName: 'أحمد السيد',   paymentType: 'cash', status: 'available', createdAt: '2025-03-10T09:00:00Z' },
  { id: 'p4', title: 'استوديو استثماري - ياس',     titleEn: 'Investment Studio Yas Island', type: 'studio',    price: 680000,  originalPrice: 650000,  premium: 30000,  size: 650,  projectName: 'Yas Golf Gates',  handover: 'offplan',  location: 'yas',           beds: 1, features: ['عائد إيجاري 7%', 'مفروشة'],                notes: '', ownerName: '', ownerPhone: '', agentId: 'AGT-003', agentName: 'عمر الرشيد',   paymentType: 'cash', status: 'available', createdAt: '2025-03-12T14:00:00Z' },
  { id: 'p5', title: 'تاون هاوس - حدائق الراحة',  titleEn: 'Townhouse Al Raha Gardens',    type: 'townhouse', price: 2100000, originalPrice: 2000000, premium: 100000, size: 2800, projectName: 'Al Raha Gardens', handover: 'ready',    location: 'raha_gardens',  beds: 3, features: ['حديقة خاصة', 'موقف مزدوج'],               notes: '', ownerName: '', ownerPhone: '', agentId: 'AGT-002', agentName: 'سارة المطيري', paymentType: 'cash', status: 'available', createdAt: '2025-03-15T08:00:00Z' },
  { id: 'p6', title: 'شقة - مدينة خليفة',          titleEn: 'Apartment Khalifa City',       type: 'apartment', price: 890000,  originalPrice: 850000,  premium: 40000,  size: 1100, projectName: 'Khalifa Heights', handover: 'offplan',  location: 'khalifa',       beds: 3, features: ['قرب مدارس', 'هادئة'],                       notes: '', ownerName: '', ownerPhone: '', agentId: 'AGT-003', agentName: 'عمر الرشيد',   paymentType: 'cash', status: 'available', createdAt: '2025-03-18T12:00:00Z' },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { id: 'all',       ar: 'الكل',       en: 'All'       },
  { id: 'apartment', ar: 'شقة',        en: 'Apartment' },
  { id: 'villa',     ar: 'فيلا',       en: 'Villa'     },
  { id: 'townhouse', ar: 'تاون هاوس', en: 'Townhouse' },
  { id: 'penthouse', ar: 'بنتهاوس',   en: 'Penthouse' },
  { id: 'studio',    ar: 'استوديو',    en: 'Studio'    },
];

const LOCATIONS = [
  { id: 'all',          ar: 'كل المواقع',        en: 'All Locations'   },
  { id: 'saadiyat',     ar: 'جزيرة السعديات',    en: 'Saadiyat Island' },
  { id: 'reem',         ar: 'جزيرة الريم',        en: 'Al Reem Island'  },
  { id: 'yas',          ar: 'جزيرة ياس',          en: 'Yas Island'      },
  { id: 'maryah',       ar: 'جزيرة الماريه',      en: 'Al Maryah'       },
  { id: 'raha_beach',   ar: 'شاطئ الراحة',        en: 'Al Raha Beach'   },
  { id: 'raha_gardens', ar: 'حدائق الراحة',       en: 'Al Raha Gardens' },
  { id: 'khalifa',      ar: 'مدينة خليفة',        en: 'Khalifa City'    },
  { id: 'mbz',          ar: 'مدينة محمد بن زايد', en: 'MBZ City'        },
  { id: 'corniche',     ar: 'الكورنيش',           en: 'Corniche Area'   },
  { id: 'khalidiyah',   ar: 'الخالدية',           en: 'Al Khalidiyah'   },
  { id: 'bateen',       ar: 'البطين',              en: 'Al Bateen'       },
  { id: 'muroor',       ar: 'شارع المرور',        en: 'Muroor Road'     },
  { id: 'tourist_club', ar: 'النادي السياحي',     en: 'TCA'             },
  { id: 'marina',       ar: 'المارينا',            en: 'Marina'          },
  { id: 'shakhbout',    ar: 'مدينة شخبوط',        en: 'Shakhbout City'  },
  { id: 'shamkha',      ar: 'الشامخة',             en: 'Al Shamkha'      },
];

// ─── PERMISSIONS ─────────────────────────────────────────────────────────────
const PERMISSIONS_MAP = [
  // ── CRM ──────────────────────────────────────────────────────────────────────
  { key:'view_leads',          ar:'عرض الليدات',              en:'View Leads',              group:'crm'      },
  { key:'assign_leads',        ar:'توزيع الليدات',             en:'Assign Leads',            group:'crm'      },
  { key:'pull_meta',           ar:'سحب من Meta',               en:'Pull from Meta',          group:'crm'      },
  { key:'view_reports',        ar:'عرض التقارير',              en:'View Reports',            group:'crm'      },
  { key:'manage_stages',       ar:'إدارة مراحل الليدات',      en:'Manage Lead Stages',      group:'crm'      },
  { key:'manage_sales_req',    ar:'إدارة طلبات المبيعات',     en:'Manage Sales Requests',   group:'crm'      },
  // ── Properties ───────────────────────────────────────────────────────────────
  { key:'add_property',        ar:'إضافة وحدات',               en:'Add Properties',          group:'prop'     },
  // ── Admin Areas ──────────────────────────────────────────────────────────────
  { key:'view_dashboard',      ar:'لوحة التحكم الرئيسية',     en:'View Dashboard',          group:'admin'    },
  { key:'view_team',           ar:'فريق العمل',                en:'View Team',               group:'admin'    },
  { key:'manage_users',        ar:'إدارة المستخدمين',          en:'Manage Users',            group:'admin'    },
  { key:'view_org',            ar:'هيكل الشركة',               en:'Org Chart',               group:'admin'    },
  { key:'manage_automations',  ar:'الأتمتة',                   en:'Automations',             group:'admin'    },
  { key:'bulk_mail',           ar:'البريد الجماعي',            en:'Bulk Mail',               group:'admin'    },
  { key:'smtp_settings',       ar:'إعدادات SMTP',              en:'SMTP Settings',           group:'admin'    },
];
const DEFAULT_PERMISSIONS = {
  admin: {
    view_leads:true, assign_leads:true, pull_meta:true, view_reports:true,
    manage_stages:true, manage_sales_req:true, add_property:true,
    view_dashboard:true, view_team:true, manage_users:true, view_org:true,
    manage_automations:true, bulk_mail:true, smtp_settings:true,
  },
  listing: {
    view_leads:false, assign_leads:false, pull_meta:false, view_reports:false,
    manage_stages:false, manage_sales_req:false, add_property:true,
    view_dashboard:false, view_team:false, manage_users:false, view_org:false,
    manage_automations:false, bulk_mail:false, smtp_settings:false,
  },
  sales: {
    view_leads:true, assign_leads:false, pull_meta:false, view_reports:false,
    manage_stages:false, manage_sales_req:false, add_property:false,
    view_dashboard:false, view_team:false, manage_users:false, view_org:false,
    manage_automations:false, bulk_mail:false, smtp_settings:false,
  },
};
const getPerms = (user) => ({ ...DEFAULT_PERMISSIONS[user.role||'sales'], ...(user.permissions||{}) });
const can = (user, key) => getPerms(user)[key] === true;

// ─── CURRENCIES ───────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code:'AED', symbolEn:'AED', symbolAr:'درهم',  country:'UAE',    flag:'🇦🇪', nameAr:'درهم إماراتي',    nameEn:'UAE Dirham'      },
  { code:'SAR', symbolEn:'SAR', symbolAr:'ريال',   country:'KSA',    flag:'🇸🇦', nameAr:'ريال سعودي',      nameEn:'Saudi Riyal'     },
  { code:'QAR', symbolEn:'QAR', symbolAr:'ريال',   country:'Qatar',  flag:'🇶🇦', nameAr:'ريال قطري',       nameEn:'Qatari Riyal'    },
  { code:'KWD', symbolEn:'KWD', symbolAr:'دينار',  country:'Kuwait', flag:'🇰🇼', nameAr:'دينار كويتي',     nameEn:'Kuwaiti Dinar'   },
  { code:'BHD', symbolEn:'BHD', symbolAr:'دينار',  country:'Bahrain',flag:'🇧🇭', nameAr:'دينار بحريني',    nameEn:'Bahraini Dinar'  },
  { code:'OMR', symbolEn:'OMR', symbolAr:'ريال',   country:'Oman',   flag:'🇴🇲', nameAr:'ريال عُماني',     nameEn:'Omani Rial'      },
  { code:'EGP', symbolEn:'EGP', symbolAr:'جنيه',   country:'Egypt',  flag:'🇪🇬', nameAr:'جنيه مصري',      nameEn:'Egyptian Pound'  },
  { code:'USD', symbolEn:'USD', symbolAr:'دولار',  country:'USA',    flag:'🇺🇸', nameAr:'دولار أمريكي',   nameEn:'US Dollar'       },
  { code:'EUR', symbolEn:'EUR', symbolAr:'يورو',    country:'EU',     flag:'🇪🇺', nameAr:'يورو',            nameEn:'Euro'            },
];

// ─── SALES REQUEST STAGES ─────────────────────────────────────────────────────
const SALES_REQUEST_STAGES = [
  { id:'new_req',    ar:'طلب جديد',       en:'New Request',      color:'#3b82f6', border:'#bfdbfe' },
  { id:'searching',  ar:'جاري البحث',     en:'Searching',        color:'#8b5cf6', border:'#ddd6fe' },
  { id:'matched',    ar:'تم التطابق',     en:'Matched',          color:'#f59e0b', border:'#fde68a' },
  { id:'viewing',    ar:'موعد معاينة',    en:'Viewing Sched.',   color:'#06b6d4', border:'#a5f3fc' },
  { id:'offer',      ar:'عرض مقدم',       en:'Offer Made',       color:'#f97316', border:'#fed7aa' },
  { id:'closed',     ar:'مغلق ✓',         en:'Closed ✓',         color:'#16a34a', border:'#bbf7d0' },
  { id:'cancelled',  ar:'ملغي',           en:'Cancelled',        color:'#ef4444', border:'#fecaca' },
];

// ─── AUTOMATION TRIGGER/ACTION TYPES ──────────────────────────────────────────
const AUTO_TRIGGERS = [
  { id:'lead_in_stage',  ar:'ليد في مرحلة لأكثر من',  en:'Lead in stage for more than' },
  { id:'lead_unassigned',ar:'ليد غير مسند لأكثر من',  en:'Lead unassigned for more than' },
  { id:'new_lead',       ar:'عند إضافة ليد جديد',      en:'When new lead added' },
];
const AUTO_ACTIONS = [
  { id:'assign_agent', ar:'تعيين لإيجنت',         en:'Assign to Agent' },
  { id:'move_stage',   ar:'نقل لمرحلة',            en:'Move to Stage' },
  { id:'notify',       ar:'إرسال تنبيه للمدير',    en:'Notify Manager' },
];

// ─── LEADS STAGES ─────────────────────────────────────────────────────────────
const LEADS_STAGES = [
  { id: 'unassigned',   ar: 'غير مسند',        en: 'Unassigned',    color: '#f43f5e', border: '#fecdd3' },
  { id: 'new',          ar: 'ليد جديد',        en: 'New Leads',     color: '#3b82f6', border: '#bfdbfe' },
  { id: 'no_answer',    ar: 'لا يرد',           en: 'No Answer',     color: '#f59e0b', border: '#fde68a' },
  { id: 'in_progress',  ar: 'قيد المتابعة',    en: 'In Progress',   color: '#10b981', border: '#a7f3d0' },
  { id: 'keep_in_loop', ar: 'استمر بالمتابعة', en: 'Keep In Loop',  color: '#f97316', border: '#fed7aa' },
  { id: 'reshuffle',    ar: 'إعادة التوزيع',   en: 'Reshuffle',     color: '#8b5cf6', border: '#ddd6fe' },
  { id: 'junk',         ar: 'ليد فاشل',        en: 'Junk Lead',     color: '#ef4444', border: '#fecaca' },
  { id: 'good',         ar: 'ليد ممتاز',       en: 'Good Lead',     color: '#16a34a', border: '#bbf7d0' },
];

// ─── ORG SEED ─────────────────────────────────────────────────────────────────
const SEED_ORG = [
  { id:'org1', name:'الرئيس التنفيذي', nameEn:'CEO & Manager',    role:'الرئيس التنفيذي',           roleEn:'CEO & Manager',       parentId:null,   color:'#4F46E5', bg:'#eef2ff', type:'ceo',  avatar:'CEO', employees:0, memberIds:[] },
  { id:'org2', name:'CRM Admin',       nameEn:'CRM Admin',        role:'إدارة علاقات العملاء',      roleEn:'CRM Admin Dept',      parentId:'org1', color:'#3b82f6', bg:'#dbeafe', type:'dept', avatar:'CRM', employees:2, memberIds:[] },
  { id:'org3', name:'مركز الاتصال',   nameEn:'Call Center',      role:'مركز الاتصال',               roleEn:'Call Center',         parentId:'org1', color:'#06b6d4', bg:'#cffafe', type:'dept', avatar:'CC',  employees:5, memberIds:[] },
  { id:'org4', name:'الحسابات والموارد', nameEn:'Accounts & HR', role:'الحسابات والموارد البشرية', roleEn:'Accounts & HR Dept',  parentId:'org1', color:'#84cc16', bg:'#ecfccb', type:'dept', avatar:'HR',  employees:3, memberIds:[] },
  { id:'org5', name:'التسويق',         nameEn:'Marketing',        role:'قسم التسويق',               roleEn:'Marketing Dept',      parentId:'org1', color:'#f59e0b', bg:'#fef3c7', type:'dept', avatar:'MKT', employees:4, memberIds:[] },
  { id:'org6', name:'المبيعات',        nameEn:'Sales',            role:'قسم المبيعات',              roleEn:'Sales Dept',          parentId:'org1', color:'#10b981', bg:'#d1fae5', type:'dept', avatar:'SLS', employees:8, memberIds:[] },
  { id:'org7', name:'الليسنج',         nameEn:'Leasing',          role:'قسم الليسنج',               roleEn:'Leasing Dept',        parentId:'org1', color:'#8b5cf6', bg:'#ede9fe', type:'dept', avatar:'LSG', employees:6, memberIds:[] },
];

const MATCH_REASONS = {
  ar: { typeMatch: 'تطابق نوع العقار', locMatch: 'تطابق الموقع', budgetMatch: 'ضمن الميزانية', budgetOver: 'يتجاوز الميزانية قليلاً', bedsMatch: 'عدد الغرف مثالي', bedsMore: 'غرف إضافية' },
  en: { typeMatch: 'Type match',        locMatch: 'Location match', budgetMatch: 'Within budget',  budgetOver: 'Slightly over budget',    bedsMatch: 'Beds match',           bedsMore: 'Extra bedrooms' },
};

const TYPE_COLORS = {
  villa:     { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
  apartment: { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' },
  penthouse: { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' },
  studio:    { bg: '#fff8e1', text: '#e65100', border: '#ffcc02' },
  townhouse: { bg: '#e0f2f1', text: '#00695c', border: '#80cbc4' },
};

// ─── MATCH ENGINE LOGIC ───────────────────────────────────────────────────────
function calcMatch(prop, prefs) {
  let score = 0; let keys = [];
  if (prefs.type === 'all' || prop.type === prefs.type) { score += 30; keys.push('typeMatch'); }
  if (prefs.location === 'all' || prop.location === prefs.location) { score += 30; keys.push('locMatch'); }
  const over = (Number(prop.price) - Number(prefs.maxPrice)) / (Number(prefs.maxPrice) || 1);
  if (Number(prop.price) <= Number(prefs.maxPrice)) { score += 25; keys.push('budgetMatch'); }
  else if (over <= 0.1) { score += 15; keys.push('budgetOver'); }
  if (Number(prop.beds) === Number(prefs.beds)) { score += 15; keys.push('bedsMatch'); }
  else if (Number(prop.beds) > Number(prefs.beds)) { score += 8; keys.push('bedsMore'); }
  return { ...prop, matchScore: score, matchReasonKeys: keys };
}

// ─── ELAPSED TIME HELPER ─────────────────────────────────────────────────────
function elapsedTime(iso, lang) {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60000);
  const h  = Math.floor(m / 60);
  const d  = Math.floor(h / 24);
  if (lang === 'ar') {
    if (d > 0) return `منذ ${d} يوم`;
    if (h > 0) return `منذ ${h} ساعة`;
    if (m > 0) return `منذ ${m} دقيقة`;
    return 'الآن';
  }
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

// ─── PDF PROPOSAL GENERATOR ───────────────────────────────────────────────────
function generateProposalHTML(props, clientName, clientPhone, user, lang) {
  const rtl = lang === 'ar';
  const dateStr = new Date().toLocaleDateString(
    lang === 'ar' ? 'ar-AE' : 'en-AE',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  const cardsHTML = props.map(p => {
    const loc      = LOCATIONS.find(l => l.id === p.location);
    const type     = PROPERTY_TYPES.find(t => t.id === p.type);
    const tc       = TYPE_COLORS[p.type] || TYPE_COLORS.apartment;
    const locName  = lang === 'ar' ? loc?.ar  : loc?.en;
    const typeName = lang === 'ar' ? type?.ar : type?.en;
    const feats    = (p.features || []).map(f => `<span class="feat">${f}</span>`).join('');
    const matchBadge = p.matchScore
      ? `<div class="match-chip">${p.matchScore}% ${lang === 'ar' ? 'تطابق' : 'match'}</div>` : '';
    return `
      <div class="card">
        <div class="card-top" style="background:${tc.bg};border-left:4px solid ${tc.text}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="type-chip" style="background:${tc.bg};color:${tc.text};border:1px solid ${tc.border}">${typeName}</span>
            ${matchBadge}
          </div>
        </div>
        <div class="card-body">
          <h3 class="prop-title">${p.title}</h3>
          ${p.titleEn && p.titleEn !== p.title ? `<p class="prop-title-en">${p.titleEn}</p>` : ''}
          <div class="details-row">
            <span>📍 ${locName || p.location}</span>
            <span>🛏 ${p.beds} ${lang === 'ar' ? 'غرف' : 'beds'}</span>
          </div>
          <div class="price-row">${Number(p.price).toLocaleString()} <span class="aed">AED</span></div>
          ${feats ? `<div class="features-row">${feats}</div>` : ''}
          <div class="agent-row">${lang === 'ar' ? 'الإيجنت:' : 'Listed by:'} <strong>${p.agentName}</strong> <span class="agent-id">${p.agentId}</span></div>
        </div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html dir="${rtl ? 'rtl' : 'ltr'}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>MAKAN — ${clientName || (lang === 'ar' ? 'عرض عقارات' : 'Property Proposal')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Tajawal','Segoe UI',sans-serif;color:#1a1a2e;background:#fff;padding:40px 48px;font-size:14px}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #185FA5;margin-bottom:28px}
    .logo-wrap{display:flex;align-items:center;gap:12px}
    .logo-icon{background:linear-gradient(135deg,#185FA5,#4A90D9);border-radius:10px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:900}
    .logo-name{font-size:24px;font-weight:900;letter-spacing:2px;color:#1a1a2e;line-height:1}
    .logo-sub{font-size:9px;color:#185FA5;font-weight:700;letter-spacing:3px;margin-top:3px}
    .header-right{text-align:${rtl ? 'left' : 'right'}}
    .header-right h2{font-size:17px;font-weight:900;color:#1a1a2e}
    .header-right p{font-size:12px;color:#888;margin-top:5px}
    .client-bar{background:#f5f7fa;border-radius:12px;padding:14px 20px;margin-bottom:28px;display:flex;gap:32px;flex-wrap:wrap;align-items:center}
    .client-field label{font-size:11px;font-weight:700;color:#aaa;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}
    .client-field span{font-size:16px;font-weight:900;color:#1a1a2e}
    .section-label{font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px}
    .cards-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
    .card{border:1.5px solid #e8eaf0;border-radius:12px;overflow:hidden;page-break-inside:avoid;break-inside:avoid}
    .card-top{padding:10px 14px}
    .type-chip{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
    .match-chip{background:#185FA5;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
    .card-body{padding:14px 16px}
    .prop-title{font-size:15px;font-weight:800;color:#1a1a2e;margin-bottom:4px}
    .prop-title-en{font-size:12px;color:#999;margin-bottom:8px}
    .details-row{display:flex;gap:16px;font-size:12px;color:#666;margin-bottom:8px;flex-wrap:wrap}
    .price-row{font-size:20px;font-weight:900;color:#185FA5;margin-bottom:8px}
    .aed{font-size:12px;font-weight:600;color:#aaa}
    .features-row{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
    .feat{background:#f0f9f0;color:#2e7d32;border:1px solid #c8e6c9;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700}
    .agent-row{font-size:11px;color:#bbb;padding-top:8px;border-top:1px solid #f5f7fa}
    .agent-id{background:#f0f2f5;border-radius:4px;padding:1px 6px;font-family:monospace;font-size:10px;color:#999;margin-${rtl ? 'right' : 'left'}:6px}
    .page-footer{margin-top:36px;padding-top:16px;border-top:1px solid #e8eaf0;display:flex;justify-content:space-between;font-size:10px;color:#bbb;flex-wrap:wrap;gap:8px}
    @media print{body{padding:20px 24px}.cards-grid{grid-template-columns:repeat(2,1fr)}.card{break-inside:avoid}}
  </style>
</head>
<body>
  <div class="page-header">
    <div class="logo-wrap">
      <div class="logo-icon">🏢</div>
      <div><div class="logo-name">MAKAN</div><div class="logo-sub">PROPERTY OS</div></div>
    </div>
    <div class="header-right">
      <h2>${lang === 'ar' ? 'عرض عقارات للعميل' : 'Client Property Proposal'}</h2>
      <p>${lang === 'ar' ? 'أعده:' : 'Prepared by:'} ${lang === 'ar' ? user.name : user.nameEn} · ${user.agentId}</p>
      <p>${dateStr}</p>
    </div>
  </div>
  <div class="client-bar">
    ${clientName  ? `<div class="client-field"><label>${lang === 'ar' ? 'اسم العميل' : 'Client Name'}</label><span>${clientName}</span></div>` : ''}
    ${clientPhone ? `<div class="client-field"><label>${lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</label><span>${clientPhone}</span></div>` : ''}
    <div class="client-field"><label>${lang === 'ar' ? 'عدد العقارات' : 'Properties'}</label><span>${props.length} ${lang === 'ar' ? 'وحدة' : 'units'}</span></div>
    <div class="client-field"><label>${lang === 'ar' ? 'إجمالي القيمة' : 'Combined Value'}</label><span>${props.reduce((s,p)=>s+Number(p.price),0).toLocaleString()} AED</span></div>
  </div>
  <div class="section-label">${lang === 'ar' ? 'العقارات المقترحة' : 'Proposed Properties'}</div>
  <div class="cards-grid">${cardsHTML}</div>
  <div class="page-footer">
    <span>MAKAN Property OS © 2025 — REAL KHALED</span>
    <span>${lang === 'ar' ? 'هذا العرض سري ومخصص للعميل المذكور فقط' : 'This proposal is confidential and intended for the named client only'}</span>
  </div>
</body>
</html>`;
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Avatar({ initials, size = 36, color = '#185FA5', bg = '#E6F1FB' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Tajawal','Segoe UI',sans-serif", fontWeight: 700,
      fontSize: size * 0.36, flexShrink: 0, border: `1.5px solid ${color}30`
    }}>{initials}</div>
  );
}

function RoleBadge({ role, lang }) {
  const map = {
    admin:   { ar: 'مدير النظام',   en: 'Admin',         bg: '#f3e5f5', color: '#6a1b9a', darkBg:'rgba(26,58,255,0.12)',  darkColor:'#7a9fff' },
    listing: { ar: 'فريق الليستنج', en: 'Listing Agent', bg: '#e3f2fd', color: '#1565c0', darkBg:'rgba(0,212,255,0.10)',  darkColor:'#00d4ff' },
    sales:   { ar: 'فريق المبيعات', en: 'Sales Agent',   bg: '#e8f5e9', color: '#2e7d32', darkBg:'rgba(0,230,118,0.10)',  darkColor:'#00e676' },
  };
  const m = map[role] || map.sales;
  return (
    <span className={`makan-role-badge makan-role-badge--${role}`} style={{
      background: m.bg, color: m.color, fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 20, letterSpacing: 0.3,
      fontFamily: "'Cairo','Tajawal','Segoe UI',sans-serif",
      border: `1px solid ${m.color}33`,
    }}>{lang === 'ar' ? m.ar : m.en}</span>
  );
}

// ─── LANG DROPDOWN (used in Login) ───────────────────────────────────────────
// ─── PERMISSION DENIED ───────────────────────────────────────────────────────
function PermissionDenied({ f, rtl }) {
  return (
    <div dir={rtl?'rtl':'ltr'} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:20, color:'#94a3b8', textAlign:'center', padding:'2rem' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(239,68,68,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Shield size={38} style={{ opacity:.4, color:'#ef4444' }}/>
      </div>
      <div>
        <h2 style={{ fontSize:20, fontWeight:800, color:'#64748b', margin:'0 0 8px' }}>{f('ليس لديك صلاحية لهذه الصفحة','Access Restricted')}</h2>
        <p style={{ fontSize:14, margin:0, color:'#94a3b8' }}>{f('تواصل مع المدير للحصول على الصلاحيات المطلوبة','Contact your admin to request access to this section')}</p>
      </div>
    </div>
  );
}

function LangDropdown({ lang, setLang, inline=false, darkMode=false }) {
  const [open, setOpen] = useState(false);
  const dk = darkMode;
  const btn = (
    <div style={{ position:'relative', zIndex:10 }}>
      <button onClick={()=>setOpen(!open)} style={{
        background: dk ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.80)',
        border: dk ? '1px solid rgba(62,79,114,0.6)' : '1px solid rgba(99,102,241,0.18)',
        backdropFilter:'blur(12px)', color: dk ? '#9aabcc' : '#4F46E5',
        borderRadius:10, padding:'8px 12px', cursor:'pointer', fontSize:13, fontWeight:700,
        display:'flex', alignItems:'center', gap:6,
        boxShadow: dk ? 'none' : '0 2px 8px rgba(99,102,241,0.10)',
        height:38,
      }}>
        <Globe size={15}/> {LANGS.find(l=>l.id===lang)?.flag||'🌐'}
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', right:0,
          background: dk ? '#0d1526' : '#fff',
          borderRadius:14,
          border: dk ? '1px solid #3e4f72' : '1px solid rgba(99,102,241,0.15)',
          boxShadow: dk ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)',
          zIndex:100, overflow:'hidden', minWidth:170,
        }}>
          {LANGS.map(l=>(
            <button key={l.id} onClick={()=>{setLang(l.id);setOpen(false);}} style={{
              display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 14px',
              background: lang===l.id ? (dk?'rgba(26,58,255,0.15)':'rgba(79,70,229,0.08)') : 'transparent',
              border:'none', cursor:'pointer',
              color: lang===l.id ? (dk?'#7a9fff':'#4F46E5') : (dk?'#9aabcc':'#374151'),
              fontSize:12, fontWeight:lang===l.id?700:500, textAlign:'left',
            }}>
              <span style={{ fontSize:16 }}>{l.flag}</span>
              <span style={{ flex:1 }}>{l.name}</span>
              {lang===l.id && <Check size={12}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
  if (inline) return btn;
  return <div style={{ position:'absolute', top:20, right:20, zIndex:10 }}>{btn}</div>;
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
// ─── NUMBER INPUT (formatted with commas) ─────────────────────────────────────
function NumberInput({ value, onChange, style, placeholder, disabled }) {
  const fmt = (v) => { const n = String(v||'').replace(/,/g,''); return n && /^\d+$/.test(n) ? Number(n).toLocaleString('en-US') : n; };
  const [display, setDisplay] = React.useState(() => fmt(value));
  React.useEffect(() => { setDisplay(fmt(value)); }, [value]);
  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw === '' || /^\d+$/.test(raw)) {
      setDisplay(raw ? Number(raw).toLocaleString('en-US') : '');
      onChange({ target: { value: raw } });
    }
  };
  return <input type="text" inputMode="numeric" value={display} onChange={handleChange} style={style} placeholder={placeholder} disabled={disabled}/>;
}

function LoginScreen({ onLogin, lang, setLang, users, darkMode, onToggleDark }) {
  const [email,    setEmail]    = useState('');
  const [pass,     setPass]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err,      setErr]      = useState('');
  const [loading,  setLoading]  = useState(false);

  const rtl = lang === 'ar' || lang === 'ur';
  const f = (ar, en) => { if (lang==='ar') return ar; if (lang==='ur') return TRANS.ur?.[en]??ar; if (lang==='en') return en; return TRANS[lang]?.[en]??en; };

  // Dark theme colors from design system
  const DK = {
    bg:       '#060a14',
    surface:  'rgba(255,255,255,0.055)',
    border:   'rgba(255,255,255,0.08)',
    input:    'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(255,255,255,0.12)',
    text:     '#ffffff',
    text2:    '#9aabcc',
    text3:    '#3e4f72',
    blue:     '#1a3aff',
    gold:     '#f5a623',
  };

  const handleLogin = async () => {
    if (!email || !pass) { setErr(f('يرجى إدخال البيانات', 'Please fill all fields')); return; }
    setLoading(true); setErr('');
    await new Promise(r => setTimeout(r, 700));
    const user = (users || []).find(u => u.email === email.toLowerCase().trim() && u.password === pass);
    if (user) {
      onLogin({ ...user });
    } else {
      setErr(f('بيانات الدخول غير صحيحة', 'Invalid credentials'));
    }
    setLoading(false);
  };


  const dk = darkMode;
  const loginInput = {
    width:'100%', padding:'11px 14px', borderRadius:10, fontSize:14, outline:'none',
    boxSizing:'border-box', fontFamily:"'Tajawal','Segoe UI',sans-serif",
    transition:'border-color .2s',
    background:   dk ? DK.input   : 'rgba(255,255,255,0.7)',
    border:       dk ? `1.5px solid ${DK.inputBorder}` : '1.5px solid rgba(226,232,240,0.8)',
    color:        dk ? DK.text    : '#0f172a',
    backdropFilter: 'blur(8px)',
  };
  const loginLabel = {
    fontSize:12, fontWeight:600, marginBottom:5, display:'block',
    color: dk ? DK.text2 : '#64748b',
  };

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: dk
        ? `radial-gradient(ellipse 80% 60% at 20% 10%, rgba(26,58,255,0.15) 0%, transparent 60%),
           radial-gradient(ellipse 60% 50% at 80% 80%, rgba(0,212,255,0.08) 0%, transparent 55%),
           #060a14`
        : ['radial-gradient(ellipse 80% 60% at 10% 5%, rgba(238,242,255,0.95) 0%, transparent 60%)',
           'radial-gradient(ellipse 60% 50% at 90% 10%, rgba(224,231,255,0.80) 0%, transparent 55%)',
           'radial-gradient(ellipse 100% 80% at 50% 50%, #f8fafc 0%, #f1f5fd 100%)'].join(','),
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem', fontFamily: "'Tajawal','Segoe UI',sans-serif", position: 'relative', overflow: 'hidden',
      transition: 'background 0.3s',
    }}>
      {/* Floating orbs */}
      {dk ? <>
        <div style={{ position:'absolute',top:'-10%',right:'-6%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(26,58,255,0.12) 0%,transparent 65%)',pointerEvents:'none'}}/>
        <div style={{ position:'absolute',bottom:'-12%',left:'-8%',width:640,height:640,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,212,255,0.06) 0%,transparent 65%)',pointerEvents:'none'}}/>
      </> : <>
        <div style={{ position:'absolute',top:'-10%',right:'-6%',width:580,height:580,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 65%)',pointerEvents:'none',animation:'floatA 14s ease-in-out infinite'}}/>
        <div style={{ position:'absolute',bottom:'-12%',left:'-8%',width:640,height:640,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.10) 0%,transparent 65%)',pointerEvents:'none',animation:'floatB 18s ease-in-out infinite'}}/>
      </>}

      {/* Top bar: Theme toggle + Lang — fixed top right */}
      <div style={{ position:'fixed', top:20, right:20, display:'flex', alignItems:'center', gap:8, zIndex:1000 }}>
        <button onClick={onToggleDark} style={{
          background: dk ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.7)',
          border: dk ? '1px solid rgba(245,166,35,0.3)' : '1px solid rgba(148,163,184,0.3)',
          borderRadius: 10, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', fontSize:18, backdropFilter:'blur(8px)',
        }}>
          {dk ? '☀️' : '🌙'}
        </button>
        <LangDropdown lang={lang} setLang={setLang} inline={true} darkMode={dk}/>
      </div>

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:'2.5rem', position:'relative', zIndex:1, animation:'logoFade .6s ease both' }}>
        <img src="./logo.png" alt="مكان" style={{
          height:130, width:'auto',
          filter: dk ? 'brightness(0) invert(1)' : 'brightness(0)',
        }} />
        <p style={{ color: dk ? DK.text2 : '#94a3b8', fontSize:13, marginTop:8, letterSpacing:0.3, fontWeight:500 }}>
          {f('نظام إدارة العقارات المتكامل','Integrated Real Estate Management System')}
        </p>
      </div>

      {/* Login card */}
      <div style={{
        background:   dk ? DK.surface : 'rgba(255,255,255,0.82)',
        border:       `1px solid ${dk ? DK.border : 'rgba(226,232,240,0.6)'}`,
        backdropFilter:'blur(24px)',
        borderRadius: 18,
        padding:'2.25rem 2rem',
        width:'100%', maxWidth:430,
        boxShadow: dk
          ? '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(26,58,255,0.1)'
          : '0 16px 56px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.05)',
        position:'relative', zIndex:1,
        animation:'loginCard .55s cubic-bezier(.22,.68,0,1.2) both',
        transition:'all 0.3s',
      }}>
        <h2 style={{ color: dk ? DK.text : '#0f172a', fontSize:20, fontWeight:700, marginBottom:'1.5rem', textAlign:'center' }}>
          {f('تسجيل الدخول','Sign In')}
        </h2>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={loginLabel}>{f('البريد الإلكتروني','Email')}</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@apex.ae"
              style={{ ...loginInput, direction:'ltr' }}
            />
          </div>
          <div style={{ position:'relative' }}>
            <label style={loginLabel}>{f('كلمة المرور','Password')}</label>
            <input value={pass} onChange={e => setPass(e.target.value)}
              type={showPass ? 'text' : 'password'}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ ...loginInput, paddingRight:40, direction:'ltr' }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{ position:'absolute',bottom:11,right:12,background:'none',border:'none',color: dk?DK.text2:'#94a3b8',cursor:'pointer',padding:0 }}>
              {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>

          {err && (
            <div style={{ background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.22)',borderRadius:8,padding:'8px 12px',color:'#ef4444',fontSize:13,display:'flex',alignItems:'center',gap:8 }}>
              <AlertCircle size={14}/> {err}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} style={{
            background: dk
              ? (loading ? 'rgba(26,58,255,0.4)' : 'linear-gradient(135deg,#1a3aff,#2d4fff)')
              : (loading ? 'rgba(79,70,229,0.45)' : '#4F46E5'),
            color:'#fff', border:'none', borderRadius:12, padding:'13px', fontSize:15, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer', marginTop:4,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            fontFamily:"'Tajawal','Segoe UI',sans-serif", transition:'all .25s',
            boxShadow: dk
              ? (loading ? 'none' : '0 8px 32px rgba(26,58,255,0.4)')
              : (loading ? 'none' : '0 6px 24px rgba(79,70,229,0.38)'),
          }}>
            {loading
              ? <RefreshCw size={18} style={{ animation:'spin 1s linear infinite' }}/>
              : <ArrowRight size={18}/>}
            {f('دخول','Sign In')}
          </button>
        </div>
      </div>

      {/* Back to landing page — web only */}
      {!window.agencyAPI && (
        <a href="./landing.html" style={{ marginTop:'1.25rem', display:'flex', alignItems:'center', gap:6, textDecoration:'none', color: dk ? DK.text2 : '#94a3b8', fontSize:13, fontWeight:500, position:'relative', zIndex:1, transition:'color .2s' }}
           onMouseEnter={e=>e.currentTarget.style.color=dk?'#e8eeff':'#475569'}
           onMouseLeave={e=>e.currentTarget.style.color=dk?DK.text2:'#94a3b8'}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          {f('الرجوع للصفحة الرئيسية','Back to Home')}
        </a>
      )}

      <div style={{ marginTop:'1rem', textAlign:'center', color: dk ? DK.text3 : '#cbd5e1', fontSize:11, letterSpacing:1, position:'relative', zIndex:1 }}>
        مَكَان © 2026 &nbsp;·&nbsp; <span style={{ color: dk ? 'rgba(26,58,255,0.7)' : 'rgba(99,102,241,0.55)', fontWeight:700 }}>REAL KHALED</span>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]   = useState('ar');
  const rtl = lang === 'ar' || lang === 'ur';
  const f = (ar, en) => { if (lang==='ar') return ar; if (lang==='ur') return TRANS.ur?.[en]??ar; if (lang==='en') return en; return TRANS[lang]?.[en]??en; };

  const [user,          setUser]          = useState(null);
  const [activeTab,     setActiveTab]     = useState('dashboard');
  const [allProperties, setAllProperties] = useState(() => getStorage('makan_props',    SEED_DATA));
  const [shortlist,     setShortlist]     = useState(() => getStorage('makan_shortlist', []));
  const [users,         setUsers]         = useState(() => getStorage('makan_users',     SEED_USERS));
  const [leads,         setLeads]         = useState(() => getStorage('makan_leads',     []));
  const [orgNodes,      setOrgNodes]      = useState(() => getStorage('makan_org',       SEED_ORG));
  const [metaConfig,    setMetaConfig]    = useState(() => getStorage('makan_meta',      { token:'', formId:'', lastSync:null }));
  const [leadsStages,   setLeadsStages]   = useState(() => getStorage('makan_stages',    LEADS_STAGES));
  const [salesRequests, setSalesRequests] = useState(() => getStorage('makan_sales_req', []));
  const [salesStages,   setSalesStages]   = useState(() => getStorage('makan_sales_stages', SALES_REQUEST_STAGES));
  const saveSalesStages = useCallback((s) => { setSalesStages(s); setStorage('makan_sales_stages', s); }, []);
  const [feedPosts,    setFeedPosts]    = useState(() => getStorage('makan_feed', []));
  const [tasks,        setTasks]        = useState(() => getStorage('makan_tasks', []));
  const [chatMessages, setChatMessages] = useState(() => getStorage('makan_chat', []));
  const [chatGroups,   setChatGroups]   = useState(() => getStorage('makan_chat_groups', []));
  const [calEvents,    setCalEvents]    = useState(() => getStorage('makan_cal', []));
  const [orgPositions, setOrgPositions] = useState(() => getStorage('makan_org_pos', {}));
  const addFeedPost    = useCallback((p)   => { setFeedPosts(prev=>{const n=[p,...prev];setStorage('makan_feed',n);return n;}); }, []);
  const deleteFeedPost = useCallback((id)  => { setFeedPosts(prev=>{const n=prev.filter(x=>x.id!==id);setStorage('makan_feed',n);return n;}); }, []);
  const addTask        = useCallback((t)   => { setTasks(prev=>{const n=[t,...prev];setStorage('makan_tasks',n);return n;}); }, []);
  const updateTask     = useCallback((id,u)=> { setTasks(prev=>{const n=prev.map(x=>x.id!==id?x:{...x,...u});setStorage('makan_tasks',n);return n;}); }, []);
  const deleteTask     = useCallback((id)  => { setTasks(prev=>{const n=prev.filter(x=>x.id!==id);setStorage('makan_tasks',n);return n;}); }, []);
  const addChatMessage    = useCallback((m)   => { setChatMessages(prev=>{const n=[...prev,m];setStorage('makan_chat',n);return n;}); }, []);
  const deleteChatMessage = useCallback((id)  => { setChatMessages(prev=>{const n=prev.filter(x=>x.id!==id);setStorage('makan_chat',n);return n;}); }, []);
  const addChatGroup    = useCallback((g)   => { setChatGroups(prev=>{const n=[...prev,g];setStorage('makan_chat_groups',n);return n;}); }, []);
  const deleteChatGroup = useCallback((id)  => { setChatGroups(prev=>{const n=prev.filter(x=>x.id!==id);setStorage('makan_chat_groups',n);return n;}); }, []);
  const addCalEvent    = useCallback((e)   => { setCalEvents(prev=>{const n=[e,...prev];setStorage('makan_cal',n);return n;}); }, []);
  const deleteCalEvent = useCallback((id)  => { setCalEvents(prev=>{const n=prev.filter(x=>x.id!==id);setStorage('makan_cal',n);return n;}); }, []);
  const saveOrgPositions = useCallback((p) => { setOrgPositions(p); setStorage('makan_org_pos',p); }, []);
  const [automations,   setAutomations]   = useState(() => getStorage('makan_autos',     []));
  const [aiSettings,    setAiSettings]    = useState(() => getStorage('makan_ai',        { apiKey:'', model:'claude-3-5-haiku-20241022' }));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  /* Mobile CSS inject — same pattern as dark mode */
  useEffect(() => {
    const el = document.documentElement;
    let s = document.getElementById('makan-mobile-inject');
    if (isMobile) {
      el.classList.add('mobile-mode');
      if (!s) { s = document.createElement('style'); s.id = 'makan-mobile-inject'; document.head.appendChild(s); }
      s.textContent = `
        html.mobile-mode, html.mobile-mode body { overflow-x: hidden !important; max-width: 100vw !important; }
        html.mobile-mode .makan-stat-card { min-width: 0 !important; flex: 1 1 calc(50% - 6px) !important; padding: 0.85rem !important; }
        html.mobile-mode .makan-stat-value { font-size: 20px !important; }
        html.mobile-mode .makan-stat-label { font-size: 10px !important; }
        html.mobile-mode .makan-card { border-radius: 12px !important; }
        html.mobile-mode .makan-kanban-col { min-width: 220px !important; max-width: 240px !important; flex-shrink: 0 !important; }
        html.mobile-mode .makan-kanban-card { border-radius: 10px !important; }
        html.mobile-mode .makan-modal {
          border-radius: 20px 20px 0 0 !important; max-width: 100% !important;
          width: 100% !important; margin: 0 !important;
        }
        html.mobile-mode .makan-chat-sidebar { display: none !important; }
        html.mobile-mode .makan-orgchart-canvas { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
        html.mobile-mode .makan-page-title { font-size: 17px !important; }
        html.mobile-mode input, html.mobile-mode select, html.mobile-mode textarea { font-size: 16px !important; }
        html.mobile-mode .makan-view-toggle { padding: 2px !important; }
        html.mobile-mode .makan-view-btn { padding: 4px 8px !important; font-size: 10px !important; }
        html.mobile-mode .makan-filter-pill { padding: 5px 10px !important; font-size: 11px !important; }
        html.mobile-mode .makan-listings-tab-btn { padding: 6px 12px !important; font-size: 11px !important; }
        html.mobile-mode .makan-btn-tool { padding: 5px 9px !important; font-size: 10px !important; }
        html.mobile-mode .makan-academy { border-radius: 12px !important; }
      `;
    } else {
      el.classList.remove('mobile-mode');
      if (s) s.remove();
    }
  }, [isMobile]);
  const [currency, setCurrency] = useState(() => getStorage('makan_currency', { code:'AED', symbolEn:'AED', symbolAr:'درهم', country:'UAE' }));
  const saveCurrency = useCallback((c) => { setCurrency(c); setStorage('makan_currency', c); }, []);
  const [darkMode, setDarkMode] = useState(() => getStorage('makan_dark_mode', false));
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      // Inject aggressive override style for inline styles
      let s = document.getElementById('makan-dark-inject');
      if (!s) { s = document.createElement('style'); s.id = 'makan-dark-inject'; document.head.appendChild(s); }
      s.textContent = `
        html.dark-mode .makan-main > * { background: transparent !important; }

        /* ── Headings → white ── */
        html.dark-mode .makan-main h1,
        html.dark-mode .makan-main h2,
        html.dark-mode .makan-main h3,
        html.dark-mode .makan-main h4,
        html.dark-mode .makan-main h5,
        html.dark-mode .makan-main h6 { color: #ffffff !important; }

        /* ── Dark text → white ── */
        html.dark-mode .makan-main [style*="color:#0f172a"],
        html.dark-mode .makan-main [style*="color: #0f172a"],
        html.dark-mode .makan-main [style*="color:#1e293b"],
        html.dark-mode .makan-main [style*="color:#334155"],
        html.dark-mode .makan-main [style*="color:#374151"],
        html.dark-mode .makan-main [style*="color:#111827"],
        html.dark-mode .makan-main [style*="color:black"],
        html.dark-mode .makan-main [style*="color: black"],
        html.dark-mode .makan-main [style*="color:#000"] { color: #e8eeff !important; }

        /* ── Muted dark text → muted light ── */
        html.dark-mode .makan-main [style*="color:#475569"],
        html.dark-mode .makan-main [style*="color:#64748b"],
        html.dark-mode .makan-main [style*="color:#94a3b8"],
        html.dark-mode .makan-main [style*="color:#6b7280"] { color: #9aabcc !important; }

        /* ── Light backgrounds → dark ── */
        html.dark-mode .makan-main [style*="background:#fff"],
        html.dark-mode .makan-main [style*="background: #fff"],
        html.dark-mode .makan-main [style*="background:#ffffff"],
        html.dark-mode .makan-main [style*="background: #ffffff"],
        html.dark-mode .makan-main [style*="background:#f8fafc"],
        html.dark-mode .makan-main [style*="background:#f1f5f9"],
        html.dark-mode .makan-main [style*="background:#f0f4ff"],
        html.dark-mode .makan-main [style*="background:#f9fafb"],
        html.dark-mode .makan-main [style*="background:white"],
        html.dark-mode .makan-main [style*="background: white"] { background: rgba(13,21,38,0.88) !important; }

        /* ── Glass cards ── */
        html.dark-mode .makan-main [style*="blur"] {
          background: rgba(13,21,38,0.88) !important;
          border-color: rgba(255,255,255,0.09) !important;
        }

        /* ── Input/select dark ── */
        html.dark-mode .makan-main input,
        html.dark-mode .makan-main select,
        html.dark-mode .makan-main textarea {
          background: rgba(255,255,255,0.06) !important;
          color: #e8eeff !important;
          border-color: rgba(255,255,255,0.12) !important;
        }

        /* ── Icons fix ── */
        html.dark-mode .makan-main svg[style*="color:#0f172a"],
        html.dark-mode .makan-main svg[style*="color:#1e293b"],
        html.dark-mode .makan-main svg[style*="color:#374151"] { color: #9aabcc !important; }
      `;
    } else {
      document.documentElement.classList.remove('dark-mode');
      const s = document.getElementById('makan-dark-inject');
      if (s) s.remove();
    }
    setStorage('makan_dark_mode', darkMode);
  }, [darkMode]);
  const isSidebarMode = !!user && !isMobile; // Mobile always uses web layout with bottom nav

  // Set smart default tab for mobile based on role
  useEffect(() => {
    if (user && isMobile && activeTab === 'dashboard' && user.role !== 'admin') {
      setActiveTab('listings');
    }
  }, [user?.role, isMobile]); // eslint-disable-line
  const [syncStatus,    setSyncStatus]    = useState(IS_CONFIGURED ? 'connecting' : 'local');
  const [agencyBlocked, setAgencyBlocked] = useState(false);

  // ── Agency active check ───────────────────────────────────────────────────
  useEffect(() => {
    if (!IS_CONFIGURED || AGENCY_ID === 'default') return;
    import('firebase/firestore').then(({ getDoc, doc: fsDoc }) => {
      getDoc(fsDoc(db, 'agencies', AGENCY_ID)).then(snap => {
        if (snap.exists() && snap.data().active === false) setAgencyBlocked(true);
      }).catch(()=>{});
    });
  }, []);

  // ── Connectivity badge ────────────────────────────────────────────────────
  // ── Firebase anonymous auth (required for Firestore rules) ───────────────
  useEffect(() => {
    if (!IS_CONFIGURED || !auth) return;
    signInAnonymously(auth).catch(console.error);
  }, []);

  useEffect(() => {
    if (!IS_CONFIGURED) return;
    if (navigator.onLine) setSyncStatus('synced');
    const goOn  = () => setSyncStatus('synced');
    const goOff = () => setSyncStatus('offline');
    window.addEventListener('online',  goOn);
    window.addEventListener('offline', goOff);
    return () => { window.removeEventListener('online', goOn); window.removeEventListener('offline', goOff); };
  }, []);

  // ── Firebase real-time sync ───────────────────────────────────────────────
  useEffect(() => {
    if (!IS_CONFIGURED) return;

    // Seed Firestore from localStorage on very first run
    const seedOnce = async () => {
      const us = await getDocs(agCol('users'));
      if (us.empty) {
        // fall back to hardcoded seeds if localStorage cache is also empty
        const localUsers = getStorage('makan_users', SEED_USERS);
        for (const u of (localUsers.length ? localUsers : SEED_USERS))
          await setDoc(agDoc('users', u.id), u);
      }
      const ps = await getDocs(agCol('properties'));
      if (ps.empty) {
        const localProps = getStorage('makan_props', SEED_DATA);
        for (const p of (localProps.length ? localProps : SEED_DATA))
          await setDoc(agDoc('properties', p.id), p);
      }
    };
    seedOnce().catch(console.error);

    // Live listeners — update state + localStorage cache whenever cloud changes
    const unsubUsers = onSnapshot(
      agCol('users'),
      snap => {
        const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (data.length > 0) { setUsers(data); setStorage('makan_users', data); }
        setSyncStatus('synced');
      },
      err => { console.error('[MAKAN] users sync:', err); setSyncStatus('offline'); }
    );

    const unsubProps = onSnapshot(
      agCol('properties'),
      snap => {
        const data = snap.docs
          .map(d => ({ ...d.data(), id: d.id }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (data.length > 0) { setAllProperties(data); setStorage('makan_props', data); }
        setSyncStatus('synced');
      },
      err => { console.error('[MAKAN] props sync:', err); setSyncStatus('offline'); }
    );

    return () => { unsubUsers(); unsubProps(); };
  }, []);

  // ── Sync logged-in user's shortlist from Firestore ────────────────────────
  useEffect(() => {
    if (!IS_CONFIGURED || !user) return;
    const unsub = onSnapshot(agDoc('users', user.id), snap => {
      if (snap.exists() && snap.data().shortlist) {
        const sl = snap.data().shortlist;
        setShortlist(sl);
        setStorage('makan_shortlist', sl);
      }
    });
    return unsub;
  }, [user?.id]);

  const visibleProps = user?.role === 'admin'
    ? allProperties
    : user?.role === 'listing'
      ? allProperties.filter(p => p.agentId === user.agentId)
      : allProperties;

  const handleLogin = useCallback((u) => {
    setUser(u);
    setActiveTab(u.role === 'sales' ? 'search' : u.role === 'admin' ? 'dashboard' : 'listings');
  }, []);

  const handleLogout = () => { setUser(null); setActiveTab('dashboard'); setShortlist([]); };

  const toggleShortlist = useCallback((id) => {
    setShortlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setStorage('makan_shortlist', next);
      if (IS_CONFIGURED && user)
        updateDoc(agDoc('users', user.id), { shortlist: next }).catch(console.error);
      return next;
    });
  }, [user]);

  const addProperty = (prop) => {
    const newProp = {
      ...prop,
      id:        'p' + Date.now(),
      agentId:   user.agentId,
      agentName: lang === 'ar' ? user.name : user.nameEn,
      status:    'available',
      createdAt: new Date().toISOString(),
    };
    setAllProperties(prev => {
      const next = [newProp, ...prev];
      setStorage('makan_props', next);
      return next;
    });
    if (IS_CONFIGURED)
      setDoc(agDoc('properties', newProp.id), newProp).catch(console.error);
  };

  const deleteProperty = (id) => {
    setAllProperties(prev => { const n = prev.filter(p => p.id !== id); setStorage('makan_props', n); return n; });
    setShortlist(prev => { const n = prev.filter(x => x !== id); setStorage('makan_shortlist', n); return n; });
    if (IS_CONFIGURED)
      deleteDoc(agDoc('properties', id)).catch(console.error);
  };

  const updateProperty = useCallback((id, updates) => {
    setAllProperties(prev => {
      const next = prev.map(p => p.id !== id ? p : { ...p, ...updates });
      setStorage('makan_props', next);
      return next;
    });
    if (IS_CONFIGURED)
      updateDoc(agDoc('properties', id), updates).catch(console.error);
  }, []);

  // ── Leads CRUD ───────────────────────────────────────────────────────────
  const saveMetaConfig = useCallback((cfg) => {
    setMetaConfig(cfg);
    setStorage('makan_meta', cfg);
  }, []);

  const saveLeadsStages = useCallback((stages) => {
    setLeadsStages(stages);
    setStorage('makan_stages', stages);
  }, []);

  // Sales requests CRUD
  const addSalesRequest   = useCallback((r)  => { setSalesRequests(p=>{const n=[r,...p];setStorage('makan_sales_req',n);return n;}); }, []);
  const updateSalesRequest= useCallback((id,u)=> { setSalesRequests(p=>{const n=p.map(r=>r.id!==id?r:{...r,...u});setStorage('makan_sales_req',n);return n;}); }, []);
  const deleteSalesRequest= useCallback((id)  => { setSalesRequests(p=>{const n=p.filter(r=>r.id!==id);setStorage('makan_sales_req',n);return n;}); }, []);

  // Automations CRUD
  const addAutomation    = useCallback((a)  => { setAutomations(p=>{const n=[...p,a];setStorage('makan_autos',n);return n;}); }, []);
  const updateAutomation = useCallback((id,u)=> { setAutomations(p=>{const n=p.map(a=>a.id!==id?a:{...a,...u});setStorage('makan_autos',n);return n;}); }, []);
  const deleteAutomation = useCallback((id)  => { setAutomations(p=>{const n=p.filter(a=>a.id!==id);setStorage('makan_autos',n);return n;}); }, []);

  // AI settings
  const saveAiSettings = useCallback((s) => { setAiSettings(s); setStorage('makan_ai',s); }, []);

  // Automation engine — runs every 5 min
  useEffect(() => {
    if (!automations.length || !leads.length) return;
    const check = () => {
      const now = Date.now();
      automations.filter(a=>a.enabled).forEach(rule => {
        if (rule.trigger?.type === 'lead_in_stage') {
          leads.forEach(lead => {
            if (lead.stage !== rule.trigger.stage) return;
            const ageH = (now - new Date(lead.updatedAt||lead.createdAt).getTime()) / 3600000;
            if (ageH >= (rule.trigger.hours || 24)) {
              if (rule.action?.type === 'assign_agent' && rule.action.agentId) {
                const ag = users.find(u=>u.agentId===rule.action.agentId);
                if (ag && lead.agentId !== ag.agentId)
                  updateLead(lead.id,{agentId:ag.agentId,agentName:ag.name,updatedAt:new Date().toISOString()});
              } else if (rule.action?.type === 'move_stage' && rule.action.stage) {
                if (lead.stage !== rule.action.stage)
                  updateLead(lead.id,{stage:rule.action.stage,updatedAt:new Date().toISOString()});
              }
            }
          });
        } else if (rule.trigger?.type === 'lead_unassigned') {
          leads.filter(l=>!l.agentId).forEach(lead => {
            const ageH = (now - new Date(lead.createdAt).getTime()) / 3600000;
            if (ageH >= (rule.trigger.hours||24) && rule.action?.agentId) {
              const ag = users.find(u=>u.agentId===rule.action.agentId);
              if (ag) updateLead(lead.id,{agentId:ag.agentId,agentName:ag.name,stage:'new',updatedAt:new Date().toISOString()});
            }
          });
        }
      });
    };
    check();
    const iv = setInterval(check, 5*60*1000);
    return () => clearInterval(iv);
  }, [automations, leads.length]);

  const addLead = useCallback((lead) => {
    setLeads(prev => { const n = [lead, ...prev]; setStorage('makan_leads', n); return n; });
    if (IS_CONFIGURED) setDoc(agDoc('leads', lead.id), lead).catch(console.error);
  }, []);

  const updateLead = useCallback((id, updates) => {
    setLeads(prev => {
      const n = prev.map(l => l.id !== id ? l : { ...l, ...updates });
      setStorage('makan_leads', n); return n;
    });
    if (IS_CONFIGURED) updateDoc(agDoc('leads', id), updates).catch(console.error);
  }, []);

  const deleteLead = useCallback((id) => {
    setLeads(prev => { const n = prev.filter(l => l.id !== id); setStorage('makan_leads', n); return n; });
    if (IS_CONFIGURED) deleteDoc(agDoc('leads', id)).catch(console.error);
  }, []);

  // ── OrgNodes CRUD ─────────────────────────────────────────────────────────
  const addOrgNode = useCallback((node) => {
    setOrgNodes(prev => { const n = [...prev, node]; setStorage('makan_org', n); return n; });
  }, []);

  const updateOrgNode = useCallback((id, updates) => {
    setOrgNodes(prev => {
      const n = prev.map(nd => nd.id !== id ? nd : { ...nd, ...updates });
      setStorage('makan_org', n);
      return n;
    });
  }, []);

  const deleteOrgNode = useCallback((id) => {
    setOrgNodes(prev => { const n = prev.filter(nd => nd.id !== id); setStorage('makan_org', n); return n; });
  }, []);

  // ── User CRUD (used by AgentsPanel) ──────────────────────────────────────
  const addUser = useCallback((newUser) => {
    setUsers(prev => { const n = [...prev, newUser]; setStorage('makan_users', n); return n; });
    if (IS_CONFIGURED)
      setDoc(agDoc('users', newUser.id), newUser).catch(console.error);
  }, []);

  const updateUserInDB = useCallback((id, updates) => {
    setUsers(prev => {
      const n = prev.map(u => u.id !== id ? u : { ...u, ...updates });
      setStorage('makan_users', n);
      return n;
    });
    if (IS_CONFIGURED)
      updateDoc(agDoc('users', id), updates).catch(console.error);
  }, []);

  const deleteUserFromDB = useCallback((id) => {
    setUsers(prev => { const n = prev.filter(u => u.id !== id); setStorage('makan_users', n); return n; });
    if (IS_CONFIGURED)
      deleteDoc(agDoc('users', id)).catch(console.error);
  }, []);

  const updateUserProfile = useCallback((userId, profileData) => {
    setUsers(prev => {
      const n = prev.map(u => u.id !== userId ? u : { ...u, ...profileData });
      setStorage('makan_users', n);
      return n;
    });
    if (IS_CONFIGURED) updateDoc(agDoc('users', userId), profileData).catch(console.error);
  }, []);

  if (agencyBlocked) return (
    <div style={{ minHeight:'100vh', background:'#060a14', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cairo,sans-serif', direction:'rtl' }}>
      <div style={{ textAlign:'center', padding:'40px 32px', maxWidth:400 }}>
        <div style={{ fontSize:56, marginBottom:20 }}>🔒</div>
        <div style={{ fontSize:22, fontWeight:800, color:'#ff4444', marginBottom:12 }}>تم إيقاف الاشتراك</div>
        <div style={{ fontSize:14, color:'#9aabcc', lineHeight:1.8, marginBottom:28 }}>
          تم إيقاف اشتراك هذه الوكالة مؤقتاً.<br/>للاستفسار أو تجديد الاشتراك تواصل مع مَكَان.
        </div>
        <a href="https://wa.me/971568679099" target="_blank" rel="noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, background:'#25d366', color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none' }}>
          💬 تواصل معنا على واتساب
        </a>
        <div style={{ marginTop:16, fontSize:11, color:'#3e4f72' }}>makancore.com</div>
      </div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} lang={lang} setLang={setLang} users={users} darkMode={darkMode} onToggleDark={()=>setDarkMode(d=>!d)}/>;

  const NAV_ITEMS = [
    ...(user.role === 'admin' || user.role === 'superadmin'   ? [{ id:'dashboard', icon:<BarChart3  size={18}/>, ar:'لوحة التحكم',  en:'Dashboard'    }] : []),
    ...(user.role !== 'listing' ? [{ id:'search',    icon:<Search     size={18}/>, ar:'محرك البحث',   en:'Match Engine' }] : []),
    { id:'listings', icon:<Building2 size={18}/>, ar:'إدارة الوحدات', en:'Manage Units' },
    ...(user.role === 'admin' || user.role === 'superadmin'   ? [{ id:'team',      icon:<Users      size={18}/>, ar:'فريق العمل',   en:'Team'         }] : []),
    ...(user.role !== 'listing' ? [{ id:'shortlist', icon:<Bookmark   size={18}/>, ar:'قائمة العميل', en:'Shortlist'    }] : []),
    ...(user.role === 'admin' || user.role === 'superadmin'   ? [{ id:'agents',    icon:<Shield     size={18}/>, ar:'المستخدمون',   en:'Agents'       }] : []),
    ...(user.role === 'admin' || user.role === 'superadmin'   ? [{ id:'orgchart',      icon:<Network       size={18}/>, ar:'هيكل الشركة',      en:'Org Chart'       }] : []),
    ...(user.role === 'admin' || user.role === 'superadmin' || can(user,'view_leads') ? [{ id:'leads',    icon:<Kanban        size={18}/>, ar:'الليدات',          en:'Leads CRM'       }] : []),
    ...(user.role !== 'sales'   ? [{ id:'sales_requests',icon:<ClipboardList size={18}/>, ar:'طلبات المبيعات',  en:'Sales Requests'  }] : []),
    ...(user.role === 'admin' || user.role === 'superadmin'   ? [{ id:'automations',   icon:<Zap           size={18}/>, ar:'الأتمتة',          en:'Automations'     }] : []),
    ...(true                    ? [{ id:'ai_chat',       icon:<Bot           size={18}/>, ar:'مساعد AI',         en:'AI Assistant'    }] : []),
    ...(true                    ? [{ id:'chat',          icon:<MessageSquare size={18}/>, ar:'المحادثات',        en:'Team Chat'       }] : []),
    ...(true                    ? [{ id:'feed',          icon:<Activity      size={18}/>, ar:'الإعلانات',        en:'Announcements'   }] : []),
    ...(true                    ? [{ id:'tasks',         icon:<CheckSquare   size={18}/>, ar:'المهام',           en:'Tasks'           }] : []),
    ...(true                    ? [{ id:'calendar',      icon:<Clock         size={18}/>, ar:'التقويم',          en:'Calendar'        }] : []),
    ...(true                    ? [{ id:'tools',         icon:<Calculator    size={18}/>, ar:'الأدوات',           en:'Tools'           }] : []),
    ...(true                    ? [{ id:'notes',         icon:<StickyNote    size={18}/>, ar:'الملاحظات',         en:'Notes'           }] : []),
    ...(user.role === 'admin' || user.role === 'superadmin'   ? [{ id:'marketing',     icon:<Megaphone     size={18}/>, ar:'التسويق',           en:'Marketing'       }] : []),
      ...(user.role === 'superadmin' ? [{ id:'superadmin', icon:<Building2 size={18}/>, ar:'إدارة الوكالات',  en:'Agencies'        }] : []),
    ...(user.role === 'admin' || user.role === 'superadmin'   ? [{ id:'bulkmail',      icon:<Mail          size={18}/>, ar:'بريد جماعي',       en:'Bulk Mail'       }] : []),
    ...(user.role === 'admin' || user.role === 'superadmin'   ? [{ id:'whatsapp_camp', icon:<MessageCircle size={18}/>, ar:'واتساب كامبين',    en:'WhatsApp'        }] : []),
    ...(user.role === 'admin' || user.role === 'superadmin'   ? [{ id:'smtp',          icon:<Settings      size={18}/>, ar:'إعدادات البريد',   en:'SMTP'            }] : []),
  ];

  const roleStyle = { accent: PRIMARY, light: 'rgba(79,70,229,0.08)' };

  const newTabRenders = (
    <>
      {activeTab === 'sales_requests' && (
        <SalesRequestsView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} requests={salesRequests} onAdd={addSalesRequest} onUpdate={updateSalesRequest} onDelete={deleteSalesRequest} users={users} allProperties={allProperties} currentUser={user} salesStages={salesStages} onSaveStages={saveSalesStages}/>
      )}
      {activeTab === 'automations' && (user.role==='admin'||user.role==='superadmin'||can(user,'manage_automations') ? <AutomationsView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} automations={automations} onAdd={addAutomation} onUpdate={updateAutomation} onDelete={deleteAutomation} users={users} leadsStages={leadsStages}/> : <PermissionDenied f={f} rtl={rtl}/>)}
      {activeTab === 'ai_chat' && (
        <AIAssistantView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} allProperties={allProperties} leads={leads} users={users} currentUser={user} leadsStages={leadsStages}/>
      )}
      {activeTab === 'feed'     && <FeedView      lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} feedPosts={feedPosts} onAddPost={addFeedPost} onDeletePost={deleteFeedPost} currentUser={user}/>}
      {activeTab === 'tasks'    && <TasksView     lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} tasks={tasks} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} users={users} currentUser={user}/>}
      {activeTab === 'chat'     && <TeamChatView  lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} messages={chatMessages} onAddMessage={addChatMessage} onDeleteMessage={deleteChatMessage} groups={chatGroups} onAddGroup={addChatGroup} onDeleteGroup={deleteChatGroup} currentUser={user} users={users}/>}
      {activeTab === 'calendar' && <CalendarView  lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} calEvents={calEvents} onAddEvent={addCalEvent} onDeleteEvent={deleteCalEvent} currentUser={user}/>}
      {activeTab === 'profile'  && <ProfileView   lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} currentUser={user} users={users} onUpdateProfile={updateUserProfile}/>}
      {activeTab === 'academy'  && <AcademyView   lang={lang} f={f} rtl={rtl} roleStyle={roleStyle}/>}
    </>
  );

  if (isSidebarMode) {
    return (
      <div dir={rtl?'rtl':'ltr'} className="makan-root" style={{ display:'flex', minHeight:'100vh', fontFamily:"'Inter','Tajawal','SF Pro Display',system-ui,sans-serif" }}>
        <Sidebar
          activeTab={activeTab} setActiveTab={setActiveTab}
          user={user} lang={lang} f={f} rtl={rtl}
          leads={leads} shortlist={shortlist} salesRequests={salesRequests} automations={automations}
          handleLogout={handleLogout} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
          setLang={setLang} syncStatus={syncStatus} currency={currency} onSaveCurrency={saveCurrency}
          darkMode={darkMode} onToggleDark={()=>setDarkMode(d=>!d)}
        />
        <div className="makan-main" style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflowX:'hidden' }}>
          <main style={{ flex:1, padding:'1.5rem', maxWidth:1400, width:'100%', boxSizing:'border-box' }}>
            {activeTab === 'dashboard'     && (user.role==='admin'||user.role==='superadmin'||can(user,'view_dashboard')    ? <AdminDashboard props={allProperties} lang={lang} f={f} roleStyle={roleStyle}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {activeTab === 'search'        && <MatchEngine props={allProperties} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} shortlist={shortlist} toggleShortlist={toggleShortlist} user={user} onUpdate={updateProperty}/>}
            {activeTab === 'listings'      && <ListingsPanel props={visibleProps} allProps={allProperties} user={user} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} onAdd={addProperty} onDelete={deleteProperty} onUpdate={updateProperty}/>}
            {activeTab === 'shortlist'     && <ShortlistView shortlist={shortlist} allProps={allProperties} user={user} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} toggleShortlist={toggleShortlist} clearShortlist={()=>setShortlist([])}/>}
            {activeTab === 'leads'         && (user.role==='admin'||user.role==='superadmin'||can(user,'view_leads')         ? <LeadsCRMView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} leads={leads} onAddLead={addLead} onUpdateLead={updateLead} onDeleteLead={deleteLead} users={users} orgNodes={orgNodes} onUpdateOrgNode={updateOrgNode} metaConfig={metaConfig} onSaveMeta={saveMetaConfig} currentUser={user} leadsStages={leadsStages} onSaveStages={saveLeadsStages}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {activeTab === 'orgchart'      && (user.role==='admin'||user.role==='superadmin'||can(user,'view_org')           ? <OrgChartView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} orgNodes={orgNodes} onAddNode={addOrgNode} onUpdateNode={updateOrgNode} onDeleteNode={deleteOrgNode} users={users} orgPositions={orgPositions} onSavePositions={saveOrgPositions}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {activeTab === 'team'          && (user.role==='admin'||user.role==='superadmin'||can(user,'view_team')          ? <TeamView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} allProps={allProperties} users={users}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {activeTab === 'agents'        && (user.role==='admin'||user.role==='superadmin'||can(user,'manage_users')       ? <AgentsPanel users={users} onAddUser={addUser} onUpdateUser={updateUserInDB} onDeleteUser={deleteUserFromDB} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} currentUser={user}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {activeTab === 'tools'         && <ToolsView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} darkMode={darkMode}/>}
            {activeTab === 'notes'         && <NotesStandaloneView lang={lang} f={f} rtl={rtl}/>}
            {activeTab === 'marketing'     && (user.role==='admin'||user.role==='superadmin' ? <MarketingView lang={lang} f={f} rtl={rtl} darkMode={darkMode}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {activeTab === 'superadmin'    && (user.role==='superadmin' ? <SuperAdminView f={f} darkMode={darkMode}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {activeTab === 'bulkmail'      && (user.role==='admin'||user.role==='superadmin'||can(user,'bulk_mail')          ? <BulkMailView lang={lang} f={f} rtl={rtl} darkMode={darkMode}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {activeTab === 'whatsapp_camp' && (user.role==='admin'||user.role==='superadmin'                                  ? <WhatsAppCampaignView lang={lang} f={f} rtl={rtl} darkMode={darkMode}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {activeTab === 'smtp'          && (user.role==='admin'||user.role==='superadmin'||can(user,'smtp_settings')      ? <SmtpSettingsView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} darkMode={darkMode}/> : <PermissionDenied f={f} rtl={rtl}/>)}
            {newTabRenders}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{
      minHeight:'100vh', overflowX:'hidden',
      fontFamily:"'Cairo','Tajawal','Inter','SF Pro Display',system-ui,sans-serif",
      display:'flex', flexDirection:'column',
      background: darkMode ? '#060a14' : undefined,
    }}>
      {/* ── HEADER ── */}
      <div style={{ padding: isMobile ? '8px 10px 0' : '12px 16px 0', position:'sticky', top:0, zIndex:100 }}>
      <style>{`
        .makan-nav::-webkit-scrollbar { display:none; }
        .makan-nav { -ms-overflow-style:none; scrollbar-width:none; }
        .nav-btn { transition: all .15s !important; }
        .nav-btn:hover { background: rgba(79,70,229,0.07) !important; color: #4F46E5 !important; }
      `}</style>
      <header className="makan-app-header" style={{
        background: darkMode ? 'rgba(9,14,28,0.95)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderRadius: isMobile ? 14 : 18,
        padding: isMobile ? '0 10px' : '0 14px',
        height: isMobile ? 50 : 52,
        display:'flex', alignItems:'center', gap: isMobile ? 6 : 8,
        boxShadow: darkMode
          ? '0 2px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 2px 20px rgba(99,102,241,0.10), 0 1px 4px rgba(0,0,0,0.05)',
        border: darkMode ? '1px solid #3e4f72' : '1px solid rgba(255,255,255,0.80)',
      }}>
        {/* ── LOGO ── */}
        <div style={{ flexShrink:0 }}>
          <img src="./logo.png" alt="مكان" style={{
            height: isMobile ? 32 : 38, width:'auto',
            filter: darkMode ? 'brightness(0) invert(1)' : 'none',
            display:'block',
          }}/>
        </div>

        {/* ── MOBILE: active tab title (fills flex space) ── */}
        {isMobile ? (
          <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:6, overflow:'hidden', paddingRight:4, paddingLeft:4 }}>
            {(() => {
              const cur = NAV_ITEMS.find(n => n.id === activeTab);
              return cur ? (<>
                {React.cloneElement(cur.icon, { size:15, color:'#1a3aff' })}
                <span style={{ fontSize:13, fontWeight:800, color: darkMode?'#e8eeff':'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {rtl ? cur.ar : cur.en}
                </span>
              </>) : null;
            })()}
          </div>
        ) : (
          /* ── DESKTOP: divider + full nav ── */
          <>
            <div style={{ width:1, height:24, background: darkMode?'#3e4f72':'#e2e8f0', flexShrink:0 }}/>
            <nav className="makan-nav" style={{ display:'flex', alignItems:'center', gap:0, overflowX:'auto', flex:1, minWidth:0 }}>
              {(() => {
                const NAV_GROUPS = [
                  ['dashboard','search','listings'],
                  ['team','shortlist','agents'],
                  ['orgchart','leads'],
                  ['sales_requests','automations'],
                  ['ai_chat','chat','feed','tasks','calendar'],
                  ['tools','notes','marketing','bulkmail','whatsapp_camp','smtp','academy'],
                ];
                const grouped = NAV_GROUPS.map(g => NAV_ITEMS.filter(item => g.includes(item.id))).filter(g => g.length > 0);
                return grouped.map((group, gi) => (
                  <React.Fragment key={gi}>
                    {gi > 0 && <div style={{ width:1, height:18, background: darkMode?'#3e4f72':'#e2e8f0', flexShrink:0, margin:'0 4px' }}/>}
                    {group.map(item => {
                      const isActive = activeTab === item.id;
                      return (
                        <button key={item.id} className="nav-btn" onClick={() => setActiveTab(item.id)} style={{
                          display:'flex', alignItems:'center', gap:5, padding:'5px 10px',
                          borderRadius:10, border:'none', cursor:'pointer',
                          fontSize:11, fontWeight:700, whiteSpace:'nowrap',
                          background: isActive ? PRIMARY : 'transparent',
                          color: isActive ? '#fff' : darkMode ? '#9aabcc' : '#64748b',
                          fontFamily:"'Cairo','Tajawal','Inter',sans-serif",
                          position:'relative', flexShrink:0,
                          boxShadow: isActive ? `0 2px 10px ${PRIMARY}44` : 'none',
                        }}>
                          {React.cloneElement(item.icon, { size:14 })}
                          {rtl ? item.ar : item.en}
                          {item.id==='shortlist' && shortlist.length>0 && (
                            <span style={{ background:'#e53935', color:'#fff', borderRadius:'50%', width:14, height:14, fontSize:8, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', marginLeft:2 }}>{shortlist.length>9?'9+':shortlist.length}</span>
                          )}
                          {item.id==='leads' && leads.length>0 && (
                            <span style={{ background:PRIMARY+'22', color:PRIMARY, borderRadius:10, fontSize:9, fontWeight:900, padding:'1px 5px', marginLeft:2 }}>{leads.length}</span>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ));
              })()}
            </nav>
          </>
        )}

        {/* ── RIGHT CONTROLS ── */}
        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 4 : 6, flexShrink:0 }}>
          {/* Sync dot — desktop only */}
          {!isMobile && (
            <div title={syncStatus} style={{
              width:8, height:8, borderRadius:'50%', flexShrink:0,
              background: syncStatus==='synced'?'#16a34a': syncStatus==='offline'?'#dc2626': syncStatus==='local'?'#94a3b8':'#f59e0b',
              boxShadow:`0 0 6px ${syncStatus==='synced'?'#16a34a':syncStatus==='offline'?'#dc2626':syncStatus==='local'?'#94a3b8':'#f59e0b'}88`,
            }}/>
          )}
          {/* Lang select — desktop only */}
          {!isMobile && (
            <select value={lang} onChange={e=>setLang(e.target.value)} style={{ background: darkMode?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.8)', border: darkMode?'1px solid #3e4f72':'1px solid #dde2ee', borderRadius:8, padding:'4px 8px', cursor:'pointer', fontSize:12, fontWeight:700, color: darkMode?'#9aabcc':'#5a6278' }}>
              {LANGS.map(l=><option key={l.id} value={l.id}>{l.flag} {l.name}</option>)}
            </select>
          )}
          {/* User avatar */}
          <div style={{ display:'flex', alignItems:'center', gap: isMobile?3:7, background:roleStyle.light, borderRadius:isMobile?'50%':10, padding: isMobile?3:'4px 10px 4px 4px', border:`1px solid ${roleStyle.accent}22` }}>
            <Avatar initials={user.avatar} size={isMobile?28:26} color={roleStyle.accent} bg={`${roleStyle.accent}22`}/>
            {!isMobile && (
              <div style={{ lineHeight:1.2 }}>
                <div style={{ fontSize:11, fontWeight:800, color: darkMode?'#e8eeff':'#0f172a', whiteSpace:'nowrap', maxWidth:90, overflow:'hidden', textOverflow:'ellipsis' }}>{rtl ? user.name : user.nameEn}</div>
                <div style={{ fontSize:9, color:roleStyle.accent, fontWeight:700, opacity:.8 }}>{rtl ? {admin:'مدير',listing:'ليستنج',sales:'مبيعات'}[user.role] : user.role}</div>
              </div>
            )}
          </div>
          {/* Dark mode toggle */}
          <button onClick={()=>setDarkMode(d=>!d)} title={darkMode?f('وضع النهار','Light'):f('وضع الليل','Dark')} style={{
            background: darkMode?'rgba(245,166,35,0.15)':'rgba(255,255,255,0.7)',
            border: darkMode?'1px solid rgba(245,166,35,0.3)':'1px solid #dde2ee',
            borderRadius:9, padding:'5px 7px', cursor:'pointer', fontSize:15,
            display:'flex', alignItems:'center', justifyContent:'center', minWidth:32,
          }}>{darkMode?'☀️':'🌙'}</button>
          {/* Logout */}
          <button onClick={handleLogout} title={f('خروج','Logout')} style={{
            background:'rgba(254,242,242,0.9)', border:'1px solid #fecaca', borderRadius:9,
            padding: isMobile?'6px':' 6px 9px', cursor:'pointer', color:'#dc2626',
            display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
          }}>
            <LogOut size={14}/>
            {!isMobile && <span>{f('خروج','Logout')}</span>}
          </button>
        </div>
      </header>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        flex:1, overflowX:'hidden',
        padding: isMobile ? '0.85rem 0.75rem 5.5rem' : '1.25rem 1.5rem 2rem',
        maxWidth: isMobile ? '100%' : 1300,
        margin:'0 auto', width:'100%', boxSizing:'border-box',
      }}>
        {activeTab === 'dashboard' && (user.role === 'admin' || user.role === 'superadmin') && (
          <AdminDashboard props={allProperties} lang={lang} f={f} roleStyle={roleStyle}/>
        )}
        {activeTab === 'search' && (
          <MatchEngine props={allProperties} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} shortlist={shortlist} toggleShortlist={toggleShortlist} user={user} onUpdate={updateProperty}/>
        )}
        {activeTab === 'listings' && (
          <ListingsPanel props={visibleProps} allProps={allProperties} user={user} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} onAdd={addProperty} onDelete={deleteProperty} onUpdate={updateProperty}/>
        )}
        {activeTab === 'team' && (user.role === 'admin' || user.role === 'superadmin') && (
          <TeamView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} allProps={allProperties} users={users}/>
        )}
        {activeTab === 'agents' && (user.role === 'admin' || user.role === 'superadmin') && (
          <AgentsPanel users={users} onAddUser={addUser} onUpdateUser={updateUserInDB} onDeleteUser={deleteUserFromDB} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} currentUser={user}/>
        )}
        {activeTab === 'shortlist' && user.role !== 'listing' && (
          <ShortlistView shortlist={shortlist} allProps={allProperties} user={user} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} toggleShortlist={toggleShortlist} clearShortlist={() => setShortlist([])}/>
        )}
        {activeTab === 'orgchart' && (user.role === 'admin' || user.role === 'superadmin') && (
          <OrgChartView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} orgNodes={orgNodes} onAddNode={addOrgNode} onUpdateNode={updateOrgNode} onDeleteNode={deleteOrgNode} users={users} orgPositions={orgPositions} onSavePositions={saveOrgPositions}/>
        )}
        {activeTab === 'leads' && (user.role === 'admin' || user.role === 'superadmin' || can(user,'view_leads')) && (
          <LeadsCRMView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} leads={leads} onAddLead={addLead} onUpdateLead={updateLead} onDeleteLead={deleteLead} users={users} orgNodes={orgNodes} onUpdateOrgNode={updateOrgNode} metaConfig={metaConfig} onSaveMeta={saveMetaConfig} currentUser={user} leadsStages={leadsStages} onSaveStages={saveLeadsStages}/>
        )}
        {activeTab === 'tools' && <ToolsView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} darkMode={darkMode}/>}
        {activeTab === 'notes' && <NotesStandaloneView lang={lang} f={f} rtl={rtl}/>}
        {activeTab === 'marketing' && (user.role==='admin'||user.role==='superadmin') && <MarketingView lang={lang} f={f} rtl={rtl} darkMode={darkMode}/>}
        {activeTab === 'superadmin' && user.role==='superadmin' && <SuperAdminView f={f} darkMode={darkMode}/>}
        {activeTab === 'bulkmail' && (user.role === 'admin' || user.role === 'superadmin') && (
          <BulkMailView lang={lang} f={f} rtl={rtl} darkMode={darkMode}/>
        )}
        {activeTab === 'whatsapp_camp' && (user.role === 'admin' || user.role === 'superadmin') && (
          <WhatsAppCampaignView lang={lang} f={f} rtl={rtl} darkMode={darkMode}/>
        )}
        {activeTab === 'smtp' && (user.role === 'admin' || user.role === 'superadmin') && (
          <SmtpSettingsView lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} darkMode={darkMode}/>
        )}
        {newTabRenders}
      </main>
      {isMobile && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          leads={leads}
          shortlist={shortlist}
          f={f}
          rtl={rtl}
          navItems={NAV_ITEMS}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ props, lang, f, roleStyle }) {
  const rtl   = lang === 'ar';
  const total = props.length;
  const totalVal = props.reduce((s, p) => s + Number(p.price || 0), 0);
  const byAgent  = props.reduce((a, p) => { a[p.agentId] = (a[p.agentId] || 0) + 1; return a; }, {});
  const topAgent = Object.entries(byAgent).sort((a, b) => b[1] - a[1])[0];
  const typeStats = PROPERTY_TYPES.filter(t => t.id !== 'all').map(t => ({
    ...t, count: props.filter(p => p.type === t.id).length
  })).filter(t => t.count > 0);

  const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="makan-stat-card" style={{
      flex:1, minWidth:150,
      padding:'1.4rem 1.5rem',
      borderTop:`3px solid ${color}`,
      position:'relative', overflow:'hidden',
      animation:'slideUp .4s ease both',
      /* Light mode glass — dark mode overridden via CSS */
      background:'rgba(255,255,255,0.72)',
      backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)',
      borderRadius:16,
      border:'1px solid rgba(148,163,184,0.22)',
      boxShadow:'0 2px 16px rgba(100,110,180,0.08)',
    }}>
      <div style={{ position:'absolute',top:-30,right:rtl?-30:'auto',left:rtl?'auto':-30,width:100,height:100,borderRadius:'50%',background:`radial-gradient(circle,${color}22 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14 }}>
        <div style={{
          background:`${color}18`, borderRadius:12, padding:10, color,
          boxShadow:`0 2px 10px ${color}30, inset 0 1px 0 rgba(255,255,255,0.5)`
        }}>{icon}</div>
        <span className="makan-stat-label" style={{
          fontSize:12, color:'#64748b', fontWeight:700, letterSpacing:0.4,
          fontFamily:"'Cairo','Tajawal','Inter',sans-serif", lineHeight:1.3,
        }}>{label}</span>
      </div>
      <div className="makan-stat-value" style={{
        fontSize:32, fontWeight:900, color:'#0f172a', lineHeight:1,
        fontFamily:"'Cairo','Inter',sans-serif", letterSpacing:-0.5,
      }}>{value}</div>
      {sub && <div className="makan-stat-sub" style={{
        fontSize:13, color:'#94a3b8', marginTop:7, fontWeight:600,
        fontFamily:"'Cairo','Tajawal',sans-serif",
      }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize:22,fontWeight:900,color:'#0f172a',marginBottom:'1.5rem',fontFamily:"'Inter','Tajawal',sans-serif",letterSpacing:-0.3 }}>
        {f('لوحة التحكم الرئيسية','Main Dashboard')}
      </h1>
      <div style={{ display:'flex',gap:16,flexWrap:'wrap',marginBottom:'1.5rem' }}>
        <StatCard icon={<Building2 size={18}/>} label={f('إجمالي الوحدات','Total Units')}    value={total}                      sub={f('وحدة متاحة','available units')}  color={roleStyle.accent}/>
        <StatCard icon={<DollarSign size={18}/>} label={f('إجمالي القيمة','Portfolio Value')} value={`${(totalVal/1e6).toFixed(1)}M`} sub="AED"                           color='#2e7d32'/>
        <StatCard icon={<Users size={18}/>}      label={f('الإيجنتس','Active Agents')}        value={Object.keys(byAgent).length} sub={f('إيجنت نشط','active agents')}      color='#e65100'/>
        <StatCard icon={<Award size={18}/>}      label={f('أكثر إيجنت','Top Agent')}          value={topAgent ? topAgent[0] : '--'} sub={topAgent ? `${topAgent[1]} ${f('وحدة','units')}` : ''} color='#6a1b9a'/>
      </div>
      <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
        <div style={{ ...GLASS,flex:2,minWidth:280,padding:'1.4rem',animation:'slideUp .45s ease both' }}>
          <h3 style={{ fontSize:11,fontWeight:800,color:'#94a3b8',marginBottom:16,letterSpacing:0.8,textTransform:'uppercase',fontFamily:"'Inter',sans-serif" }}>{f('توزيع أنواع العقارات','Property Type Breakdown')}</h3>
          {typeStats.map(t => (
            <div key={t.id} style={{ marginBottom:12 }}>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:5 }}>
                <span style={{ fontWeight:600,color:'#0f172a',fontFamily:"'Inter','Tajawal',sans-serif" }}>{lang === 'ar' ? t.ar : t.en}</span>
                <span style={{ color:roleStyle.accent,fontWeight:700,fontFamily:"'Inter',sans-serif" }}>{t.count}</span>
              </div>
              <div style={{ background:'rgba(241,245,249,0.8)',borderRadius:20,height:7,overflow:'hidden' }}>
                <div style={{ background:`linear-gradient(${rtl?270:90}deg,${roleStyle.accent},${roleStyle.accent}99)`,width:`${Math.round((t.count/total)*100)}%`,height:'100%',borderRadius:20,transition:'width .6s',boxShadow:`0 0 8px ${roleStyle.accent}44` }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...GLASS,flex:3,minWidth:280,padding:'1.4rem',animation:'slideUp .5s ease both' }}>
          <h3 style={{ fontSize:11,fontWeight:800,color:'#94a3b8',marginBottom:16,letterSpacing:0.8,textTransform:'uppercase',fontFamily:"'Inter',sans-serif" }}>{f('آخر الوحدات المضافة','Recent Listings')}</h3>
          {props.slice(0,5).map(p => {
            const loc = LOCATIONS.find(l => l.id === p.location);
            const tc  = TYPE_COLORS[p.type] || TYPE_COLORS.apartment;
            return (
              <div key={p.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'9px 0',borderBottom:'1px solid rgba(226,232,240,0.6)' }}>
                <div style={{ background:tc.bg,color:tc.text,borderRadius:10,width:38,height:38,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 2px 8px ${tc.border}55` }}>
                  <Home size={16}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:'#0f172a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontFamily:"'Inter','Tajawal',sans-serif" }}>{p.title}</div>
                  <div style={{ fontSize:11,color:'#94a3b8',marginTop:2,fontWeight:500 }}>{loc ? (lang === 'ar' ? loc.ar : loc.en) : p.location} · {p.agentName}</div>
                  {p.reservedBy && <div style={{ fontSize:10,fontWeight:700,color:roleStyle.accent,marginTop:2,display:'flex',alignItems:'center',gap:4 }}><Shield size={10}/>{f('محجوز:','Reserved:')} {p.reservedBy} · {elapsedTime(p.reservedAt, lang)}</div>}
                </div>
                <div style={{ textAlign:'end' }}>
                  <div style={{ fontSize:13,fontWeight:800,color:roleStyle.accent,whiteSpace:'nowrap',fontFamily:"'Inter',sans-serif" }}>{Number(p.price).toLocaleString()}</div>
                  {p.reservedBy && <div style={{ fontSize:9,fontWeight:700,background:'rgba(79,70,229,0.10)',color:roleStyle.accent,borderRadius:6,padding:'1px 6px',marginTop:2 }}>{f('محجوزة','Reserved')}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MATCH ENGINE ─────────────────────────────────────────────────────────────
// ─── PROPERTY DETAIL MODAL ───────────────────────────────────────────────────
function PropertyDetailModal({ prop, user, lang, f, rtl, roleStyle, shortlist, toggleShortlist, onClose }) {
  if (!prop) return null;
  const loc    = LOCATIONS.find(l => l.id === prop.location);
  const tc     = TYPE_COLORS[prop.type] || TYPE_COLORS.apartment;
  const inList = shortlist?.includes(prop.id);
  const isSales = user?.role === 'sales';
  const typeName = lang==='ar' ? PROPERTY_TYPES.find(t=>t.id===prop.type)?.ar : PROPERTY_TYPES.find(t=>t.id===prop.type)?.en;

  const SLabel = ({ children }) => (
    <div style={{ fontSize:10, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
      <span>{children}</span>
      <div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
    </div>
  );

  const InfoBox = ({ label, value, icon, accent }) => (
    <div style={{ background: accent?`${accent}08`:'#f8fafc', borderRadius:12, padding:'12px 14px', border:`1px solid ${accent?accent+'22':'#e2e8f0'}` }}>
      <div style={{ fontSize:10, fontWeight:700, color: accent||'#94a3b8', marginBottom:5, display:'flex', alignItems:'center', gap:4 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize:14, fontWeight:800, color: accent||'#0f172a' }}>{value}</div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(10,14,30,0.75)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#ffffff',
        borderRadius:24,
        width:'100%', maxWidth:560,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 32px 100px rgba(10,14,30,0.40), 0 8px 24px rgba(10,14,30,0.15)',
        position:'relative',
        fontFamily:"'Tajawal','Segoe UI',sans-serif",
      }}>
        {/* ── HEADER ── */}
        <div style={{
          background: `linear-gradient(135deg, ${tc.text}, ${tc.text}dd)`,
          padding:'1.5rem 1.5rem 1.25rem',
          borderRadius:'24px 24px 0 0',
          position:'relative',
          overflow:'hidden',
        }}>
          {/* decorative circle */}
          <div style={{ position:'absolute', top:-40, right: rtl?'auto':-30, left: rtl?-30:'auto', width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }}/>

          {/* Close */}
          <button onClick={onClose} style={{ position:'absolute', top:14, right:rtl?'auto':14, left:rtl?14:'auto', background:'rgba(255,255,255,0.20)', border:'1px solid rgba(255,255,255,0.30)', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', transition:'all .15s' }}>
            <X size={16}/>
          </button>

          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ background:'rgba(255,255,255,0.18)', borderRadius:14, width:48, height:48, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Home size={22} color="#fff"/>
            </div>
            <div style={{ flex:1, paddingTop:2 }}>
              <div style={{ display:'flex', gap:7, alignItems:'center', marginBottom:6, flexWrap:'wrap' }}>
                <span style={{ background:'rgba(255,255,255,0.22)', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{typeName}</span>
                {prop.handover && (
                  <span style={{ background: prop.handover==='ready'?'rgba(16,185,129,0.25)':'rgba(245,158,11,0.25)', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                    {prop.handover==='ready'?f('جاهزة ✓','Ready ✓'):f('على الخارطة','Off Plan')}
                  </span>
                )}
              </div>
              {prop.projectName && <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', fontWeight:600, marginBottom:3 }}>{prop.projectName}</div>}
              <h2 style={{ fontSize:20, fontWeight:900, color:'#fff', margin:0, lineHeight:1.3 }}>{prop.title}</h2>
            </div>
          </div>

          {/* Price bar */}
          <div style={{ marginTop:'1rem', background:'rgba(255,255,255,0.15)', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', backdropFilter:'blur(8px)' }}>
            <div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:700, marginBottom:2 }}>{f('السعر المطلوب','Asking Price')}</div>
              <div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1 }}>{Number(prop.price).toLocaleString()}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 }}>AED</div>
            </div>
            {prop.premium && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:700, marginBottom:2 }}>{f('البريميوم','Premium')}</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#fde68a' }}>+{Number(prop.premium).toLocaleString()}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>AED</div>
              </div>
            )}
            {prop.originalPrice && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:700, marginBottom:2 }}>{f('الأصلي','Original')}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.80)', textDecoration:'line-through' }}>{Number(prop.originalPrice).toLocaleString()}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>AED</div>
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:18 }}>

          {/* Unit Info */}
          <div>
            <SLabel>{f('معلومات الوحدة','Unit Info')}</SLabel>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <InfoBox label={f('الموقع','Location')} value={loc?(lang==='ar'?loc.ar:loc.en):prop.location} icon={<MapPin size={10}/>}/>
              <InfoBox label={f('عدد الغرف','Bedrooms')} value={`${prop.beds} ${f('غرف','beds')}`} icon={<BedDouble size={10}/>}/>
              {prop.size && <InfoBox label={f('المساحة','Size')} value={`${Number(prop.size).toLocaleString()} ${f('قدم²','sqft')}`}/>}
              <InfoBox label={f('طريقة الدفع','Payment')} value={prop.paymentType==='cash'?f('كاش','Cash'):f('تمويل','Mortgage')} accent={prop.paymentType==='mortgage'?'#3b82f6':undefined}/>
            </div>
          </div>

          {/* Features */}
          {prop.features?.length > 0 && (
            <div>
              <SLabel>{f('المميزات','Features')}</SLabel>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {prop.features.map((feat,i) => (
                  <span key={i} style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:20, padding:'5px 13px', fontSize:12, fontWeight:700 }}>✓ {feat}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {prop.notes && (
            <div style={{ background:'#f8fafc', borderRadius:12, padding:'12px 16px', border:'1px solid #e2e8f0' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', marginBottom:6 }}>{f('ملاحظات','Notes')}</div>
              <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>{prop.notes}</div>
            </div>
          )}

          {/* Owner Info */}
          {!isSales && (prop.ownerName || prop.ownerPhone) && (
            <div>
              <SLabel>{f('معلومات المالك — سرية','Owner Info — Confidential')}</SLabel>
              <div style={{ background:'#fff7ed', borderRadius:14, padding:'14px 16px', border:'2px solid #fed7aa', display:'flex', gap:20, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ background:'#ea580c', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Shield size={16} color="#fff"/>
                  </div>
                  <div>
                    {prop.ownerName && <div><div style={{ fontSize:10, color:'#ea580c', fontWeight:700 }}>{f('المالك','Owner')}</div><div style={{ fontSize:15, fontWeight:900, color:'#c2410c' }}>{prop.ownerName}</div></div>}
                    {prop.ownerPhone && <div style={{ fontSize:13, fontWeight:700, color:'#9a3412', marginTop:3 }}>📞 {prop.ownerPhone}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Brochure */}
          {prop.brochureUrl && (
            <a href={prop.brochureUrl} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:12, background:`${roleStyle.accent}0f`, border:`1.5px solid ${roleStyle.accent}33`, color:roleStyle.accent, fontSize:13, fontWeight:700, textDecoration:'none', transition:'all .18s' }}>
              <FileText size={15}/>{f('عرض البروشور / المخطط','View Brochure / Floorplan')}
            </a>
          )}

          {/* Agent + Shortlist */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:'2px solid #f1f5f9', flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ background:`${roleStyle.accent}18`, borderRadius:10, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <User size={16} color={roleStyle.accent}/>
              </div>
              <div>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>{f('الإيجنت','Agent')}</div>
                <div style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>{prop.agentName} <span style={{ color:'#94a3b8', fontFamily:'monospace', fontSize:11 }}>· {prop.agentId}</span></div>
              </div>
            </div>
            {toggleShortlist && (
              <button onClick={() => toggleShortlist(prop.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, cursor:'pointer', border:`2px solid ${inList?roleStyle.accent:'#e2e8f0'}`, background: inList?roleStyle.accent:'#fff', color: inList?'#fff':'#64748b', fontSize:13, fontWeight:700, fontFamily:"'Tajawal','Segoe UI',sans-serif", transition:'all .2s', boxShadow: inList?`0 4px 14px ${roleStyle.accent}44`:'none' }}>
                {inList?<BookmarkCheck size={15}/>:<Bookmark size={15}/>}
                {inList?f('محفوظة ✓','Saved ✓'):f('حفظ في القائمة','Save to List')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchEngine({ props, lang, f, rtl, roleStyle, shortlist, toggleShortlist, user, onUpdate }) {
  const [prefs,        setPrefs]       = useState({ type:'all', maxPrice:3000000, location:'all', beds:2, handover:'all', paymentType:'all' });
  const [results,      setResults]     = useState([]);
  const [loading,      setLoading]     = useState(false);
  const [searched,     setSearched]    = useState(false);
  const [selectedProp, setSelectedProp] = useState(null);

  const handleMatch = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const preFiltered = props
      .filter(p => prefs.handover     === 'all' || p.handover     === prefs.handover)
      .filter(p => prefs.paymentType  === 'all' || p.paymentType  === prefs.paymentType);
    const scored = preFiltered.map(p => calcMatch(p, prefs)).sort((a,b) => b.matchScore - a.matchScore).filter(p => p.matchScore >= 30);
    setResults(scored); setSearched(true); setLoading(false);
  };

  return (
    <div>
      {selectedProp && <PropertyDetailModal prop={selectedProp} user={user} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} shortlist={shortlist} toggleShortlist={toggleShortlist} onClose={() => setSelectedProp(null)}/>}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:900,color:'#0f172a',margin:0,fontFamily:"'Inter','Tajawal',sans-serif",letterSpacing:-0.3 }}>{f('محرك المطابقة الذكي','Smart Match Engine')}</h1>
          <p style={{ color:'#64748b',fontSize:13,marginTop:4 }}>{f(`${props.length} وحدة في قاعدة البيانات`,`${props.length} units in database`)}</p>
        </div>
        {shortlist.length > 0 && (
          <div style={{ ...GLASS,borderRadius:12,padding:'8px 14px',display:'flex',alignItems:'center',gap:8,fontSize:13 }}>
            <Bookmark size={15} color={roleStyle.accent}/>
            <span style={{ fontWeight:700,color:roleStyle.accent }}>{shortlist.length}</span>
            <span style={{ color:'#aaa' }}>{f('محفوظة في قائمة العميل','saved to shortlist')}</span>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div style={{ ...GLASS,padding:'1.4rem',marginBottom:'1.5rem' }}>
        <div style={{ display:'flex',flexWrap:'wrap',gap:16,alignItems:'flex-end' }}>
          <div style={{ flex:'1 1 140px' }}>
            <label style={{ fontSize:12,fontWeight:700,color:'#888',display:'block',marginBottom:8 }}>{f('نوع العقار','Property Type')}</label>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
              {PROPERTY_TYPES.map(t => (
                <button key={t.id} onClick={() => setPrefs({...prefs,type:t.id})}
                  className={`makan-filter-pill${prefs.type===t.id?' makan-filter-pill--active':''}`}
                  style={{
                    padding:'5px 12px', borderRadius:20,
                    border:`1.5px solid ${prefs.type === t.id ? roleStyle.accent : '#e0e3e9'}`,
                    background: prefs.type === t.id ? roleStyle.light : '#fff',
                    color:      prefs.type === t.id ? roleStyle.accent : '#666',
                    fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo','Tajawal','Segoe UI',sans-serif"
                  }}>{lang === 'ar' ? t.ar : t.en}</button>
              ))}
            </div>
          </div>

          <div style={{ flex:'1 1 160px' }}>
            <label style={{ fontSize:12,fontWeight:700,color:'#888',display:'block',marginBottom:8 }}>{f('الموقع','Location')}</label>
            <select value={prefs.location} onChange={e => setPrefs({...prefs,location:e.target.value})} style={{ width:'100%',padding:'9px 12px',borderRadius:10,border:'1.5px solid #e0e3e9',fontSize:13,fontWeight:600,color:'#0f172a',outline:'none',background:'#fff',fontFamily:"'Tajawal','Segoe UI',sans-serif",direction: rtl ? 'rtl' : 'ltr' }}>
              {LOCATIONS.map(l => <option key={l.id} value={l.id}>{lang === 'ar' ? l.ar : l.en}</option>)}
            </select>
          </div>

          <div style={{ flex:'1 1 200px' }}>
            <label style={{ fontSize:12,fontWeight:700,color:'#888',display:'block',marginBottom:8 }}>
              {f('الميزانية القصوى','Max Budget')} — <span style={{ color:roleStyle.accent,fontWeight:900 }}>{Number(prefs.maxPrice).toLocaleString()} AED</span>
            </label>
            <input type="range" min={200000} max={20000000} step={100000}
              value={prefs.maxPrice} onChange={e => setPrefs({...prefs,maxPrice:+e.target.value})}
              style={{ width:'100%',accentColor:roleStyle.accent }}
            />
          </div>

          <div style={{ flex:'0 0 auto' }}>
            <label style={{ fontSize:12,fontWeight:700,color:'#888',display:'block',marginBottom:8 }}>{f('عدد الغرف','Bedrooms')}</label>
            <div style={{ display:'flex',gap:6 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setPrefs({...prefs,beds:n})}
                  className={`makan-filter-pill${prefs.beds===n?' makan-filter-pill--active makan-filter-pill--solid':''}`}
                  style={{
                    width:36, height:36, borderRadius:10,
                    border:`1.5px solid ${prefs.beds === n ? roleStyle.accent : '#e0e3e9'}`,
                    background: prefs.beds === n ? roleStyle.accent : '#fff',
                    color:      prefs.beds === n ? '#fff' : '#555',
                    fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo','Tajawal','Segoe UI',sans-serif"
                  }}>{n}{n===5?'+':''}</button>
              ))}
            </div>
          </div>

          <div style={{ flex:'0 0 auto' }}>
            <label style={{ fontSize:12,fontWeight:700,color:'#888',display:'block',marginBottom:8 }}>{f('حالة التسليم','Readiness')}</label>
            <div style={{ display:'flex',gap:6 }}>
              {[{id:'all',ar:'الكل',en:'All'},{id:'ready',ar:'جاهزة',en:'Ready'},{id:'offplan',ar:'على الخارطة',en:'Off-Plan'}].map(o => (
                <button key={o.id} onClick={() => setPrefs({...prefs,handover:o.id})}
                  className={`makan-filter-pill${prefs.handover===o.id?' makan-filter-pill--active':''}`}
                  style={{
                    padding:'6px 12px', borderRadius:10,
                    border:`1.5px solid ${prefs.handover===o.id?roleStyle.accent:'#e0e3e9'}`,
                    background: prefs.handover===o.id?roleStyle.light:'#fff',
                    color:      prefs.handover===o.id?roleStyle.accent:'#666',
                    fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo','Tajawal','Segoe UI',sans-serif"
                  }}>{lang==='ar'?o.ar:o.en}</button>
              ))}
            </div>
          </div>

          <div style={{ flex:'0 0 auto' }}>
            <label style={{ fontSize:12,fontWeight:700,color:'#888',display:'block',marginBottom:8 }}>{f('طريقة الدفع','Payment')}</label>
            <div style={{ display:'flex',gap:6 }}>
              {[{id:'all',ar:'الكل',en:'All'},{id:'cash',ar:'كاش',en:'Cash'},{id:'mortgage',ar:'تمويل',en:'Mortgage'}].map(o => (
                <button key={o.id} onClick={() => setPrefs({...prefs,paymentType:o.id})}
                  className={`makan-filter-pill${prefs.paymentType===o.id?' makan-filter-pill--active':''}`}
                  style={{
                    padding:'6px 12px', borderRadius:10,
                    border:`1.5px solid ${prefs.paymentType===o.id?roleStyle.accent:'#e0e3e9'}`,
                    background: prefs.paymentType===o.id?roleStyle.light:'#fff',
                    color:      prefs.paymentType===o.id?roleStyle.accent:'#666',
                    fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo','Tajawal','Segoe UI',sans-serif"
                  }}>{lang==='ar'?o.ar:o.en}</button>
              ))}
            </div>
          </div>

          <button onClick={handleMatch} disabled={loading || props.length === 0} style={{
            background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}bb)`,
            color:'#fff', border:'none', borderRadius:12, padding:'11px 30px',
            fontSize:14, fontWeight:700, cursor: loading || props.length === 0 ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap',
            fontFamily:"'Tajawal','Segoe UI',sans-serif", opacity: props.length === 0 ? .5 : 1,
            transition:'all .22s', boxShadow: props.length === 0 ? 'none' : `0 6px 20px ${roleStyle.accent}44`
          }}>
            {loading ? <RefreshCw size={16} style={{ animation:'spin 1s linear infinite' }}/> : <Target size={16}/>}
            {f('طابق الآن','Match Now')} ({props.length})
          </button>
        </div>
      </div>

      {!searched && !loading && (
        <div style={{ textAlign:'center',padding:'4rem 1rem',color:'#bbb' }}>
          <Target size={48} style={{ opacity:.3,marginBottom:16 }}/>
          <p style={{ fontSize:16,fontWeight:700 }}>{f('حدد المعايير وابدأ المطابقة','Set criteria and start matching')}</p>
        </div>
      )}
      {searched && results.length === 0 && (
        <div style={{ textAlign:'center',padding:'4rem 1rem',color:'#94a3b8',...GLASS,borderRadius:16,border:'1px dashed rgba(99,102,241,0.2)' }}>
          <Search size={48} style={{ opacity:.3,marginBottom:16 }}/>
          <p style={{ fontSize:16,fontWeight:700,color:'#999' }}>{f('لا توجد نتائج تطابق معاييرك','No properties match your criteria')}</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
            <h3 style={{ fontSize:15,fontWeight:700,color:'#0f172a' }}>{f(`تم العثور على ${results.length} نتيجة`,`Found ${results.length} matches`)}</h3>
            <span style={{ fontSize:12,color:'#aaa' }}>{f('مرتبة حسب التطابق','Sorted by match score')}</span>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {results.map(p => {
              const loc    = LOCATIONS.find(l => l.id === p.location);
              const tc     = TYPE_COLORS[p.type] || TYPE_COLORS.apartment;
              const reasons = MATCH_REASONS[lang];
              const isTop  = p.matchScore >= 85;
              const inList = shortlist.includes(p.id);
              return (
                <div key={p.id} className="makan-card" style={{
                  ...GLASS,
                  border:`1.5px solid ${isTop ? PRIMARY+'55' : 'rgba(255,255,255,0.60)'}`,
                  padding:'1.35rem', display:'flex', gap:16, flexWrap:'wrap',
                  boxShadow: isTop ? `0 8px 32px rgba(79,70,229,0.18), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)` : GLASS.boxShadow,
                  transition:'all .22s', position:'relative', overflow:'hidden'
                }}>
                  {isTop && (
                    <div style={{ position:'absolute',top:0,left: rtl?'auto':0,right: rtl?0:'auto',background:roleStyle.accent,color:'#fff',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius: rtl?'0 0 10px 0':'0 0 0 10px' }}>
                      {f('أفضل تطابق','Best Match')}
                    </div>
                  )}
                  {/* Score */}
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minWidth:80,paddingTop: isTop?8:0 }}>
                    <div style={{ width:64,height:64,borderRadius:'50%',background:`conic-gradient(${roleStyle.accent} ${p.matchScore*3.6}deg,#f0f2f5 0)`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <div style={{ width:50,height:50,borderRadius:'50%',background:'rgba(255,255,255,0.85)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column' }}>
                        <span style={{ fontSize:16,fontWeight:900,color:roleStyle.accent,lineHeight:1 }}>{p.matchScore}</span>
                        <span style={{ fontSize:9,color:'#aaa',fontWeight:600 }}>%</span>
                      </div>
                    </div>
                    <span style={{ fontSize:10,color:'#aaa',marginTop:4,fontWeight:600 }}>{f('تطابق','match')}</span>
                  </div>
                  {/* Info */}
                  <div style={{ flex:1,minWidth:200,paddingTop: isTop?8:0 }}>
                    <div style={{ display:'flex',gap:8,alignItems:'center',marginBottom:6,flexWrap:'wrap' }}>
                      <span style={{ ...tc,background:tc.bg,fontSize:11,fontWeight:700,padding:'2px 10px',borderRadius:20,border:`1px solid ${tc.border}` }}>
                        {lang === 'ar' ? PROPERTY_TYPES.find(t=>t.id===p.type)?.ar : PROPERTY_TYPES.find(t=>t.id===p.type)?.en}
                      </span>
                      <span style={{ background:'#f5f7fa',color:'#475569',fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,display:'flex',alignItems:'center',gap:4 }}>
                        <Hash size={10}/>{p.agentId}
                      </span>
                    </div>
                    <h3 style={{ fontSize:16,fontWeight:800,color:'#0f172a',marginBottom:8 }}>{p.title}</h3>
                    <div style={{ display:'flex',gap:16,flexWrap:'wrap',fontSize:13,color:'#475569',marginBottom:12 }}>
                      <span style={{ display:'flex',alignItems:'center',gap:5 }}><MapPin size={13} color="#aaa"/>{loc?(lang==='ar'?loc.ar:loc.en):p.location}</span>
                      <span style={{ display:'flex',alignItems:'center',gap:5 }}><BedDouble size={13} color="#aaa"/>{p.beds} {f('غرف','beds')}</span>
                      <span style={{ display:'flex',alignItems:'center',gap:5,fontWeight:800,color:roleStyle.accent }}><DollarSign size={13}/>{Number(p.price).toLocaleString()} AED</span>
                    </div>
                    <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                      {p.matchReasonKeys.map((k,i) => (
                        <span key={i} style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,background:'#f0f9f0',color:'#2e7d32',border:'1px solid #c8e6c9',borderRadius:20,padding:'3px 10px',fontWeight:700 }}>
                          <CheckCircle2 size={11}/>{reasons[k]}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Right: agent + actions */}
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',justifyContent:'space-between',gap:10,paddingTop: isTop?8:0 }}>
                    <div style={{ background:'rgba(241,245,249,0.7)',borderRadius:10,padding:'6px 10px',textAlign:'center',border:'1px solid rgba(226,232,240,0.6)' }}>
                      <div style={{ fontSize:10,color:'#94a3b8',fontWeight:600 }}>{f('رفعها','Added by')}</div>
                      <div style={{ fontSize:12,fontWeight:800,color:'#0f172a',marginTop:2 }}>{p.agentName}</div>
                    </div>
                    <button onClick={() => setSelectedProp(p)} style={{
                      display:'flex', alignItems:'center', gap:6,
                      padding:'7px 14px', borderRadius:10, cursor:'pointer',
                      border:`1.5px solid ${roleStyle.accent}`,
                      background: roleStyle.light, color: roleStyle.accent,
                      fontSize:12, fontWeight:700, transition:'all .18s',
                      fontFamily:"'Tajawal','Segoe UI',sans-serif", whiteSpace:'nowrap'
                    }}>
                      <Eye size={14}/> {f('التفاصيل','Details')}
                    </button>
                    <button onClick={() => toggleShortlist(p.id)} className="shortlist-btn" style={{
                      display:'flex', alignItems:'center', gap:6,
                      padding:'7px 12px', borderRadius:10, cursor:'pointer',
                      border:`1.5px solid ${inList ? roleStyle.accent : '#e0e3e9'}`,
                      background: inList ? roleStyle.accent : '#fff',
                      color:      inList ? '#fff' : '#aaa',
                      fontSize:12, fontWeight:700, transition:'all .18s',
                      fontFamily:"'Tajawal','Segoe UI',sans-serif", whiteSpace:'nowrap'
                    }}>
                      {inList ? <BookmarkCheck size={14}/> : <Bookmark size={14}/>}
                      {inList ? f('محفوظة','Saved') : f('حفظ','Save')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LISTINGS PANEL ───────────────────────────────────────────────────────────
function ListingsPanel({ props, allProps, user, lang, f, rtl, roleStyle, onAdd, onDelete, onUpdate }) {
  const emptyForm = { title:'', titleEn:'', type:'apartment', price:'', originalPrice:'', premium:'', size:'', projectName:'', handover:'ready', paymentType:'cash', location:'reem', beds:'2', features:'', notes:'', ownerName:'', ownerPhone:'' };
  const [form,         setForm]        = useState(emptyForm);
  const [tab,          setTab]         = useState('list');
  const [selectedProp, setSelectedProp] = useState(null);
  const [csvStatus,    setCsvStatus]   = useState('');
  const [csvLoading,   setCsvLoading]  = useState(false);
  const [uploading,    setUploading]   = useState(false);
  const [brochureFile, setBrochureFile] = useState(null);
  const fileRef       = useRef(null);
  const brochureInputRef = useRef(null);

  const fld = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) return;
    setUploading(true);
    let brochureUrl = '';
    if (brochureFile && storage) {
      try {
        const r    = sRef(storage, `brochures/${Date.now()}_${brochureFile.name}`);
        const snap = await uploadBytes(r, brochureFile);
        brochureUrl = await getDownloadURL(snap.ref);
      } catch (err) { console.error('[MAKAN] Brochure upload:', err); }
    }
    onAdd({
      title:         form.title,
      titleEn:       form.titleEn || form.title,
      type:          form.type,
      price:         Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : '',
      premium:       form.premium       ? Number(form.premium)       : '',
      size:          form.size          ? Number(form.size)          : '',
      projectName:   form.projectName,
      handover:      form.handover,
      paymentType:   form.paymentType,
      location:      form.location,
      beds:          Number(form.beds),
      features:      form.features.split(',').map(x=>x.trim()).filter(Boolean),
      notes:         form.notes,
      ownerName:     form.ownerName,
      ownerPhone:    form.ownerPhone,
      brochureUrl,
    });
    setForm(emptyForm);
    setBrochureFile(null);
    if (brochureInputRef.current) brochureInputRef.current.value = '';
    setUploading(false);
    setTab('list');
  };

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rows = ev.target.result.split(/\r?\n/).filter(r=>r.trim());
      let count = 0;
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',');
        if (cols.length >= 5 && cols[0].trim()) {
          const [title,type,price,location,beds,featuresRaw] = cols;
          const validTypes = ['apartment','villa','townhouse','penthouse','studio'];
          onAdd({ title:title.trim(), titleEn:title.trim(), type:validTypes.includes(type.trim().toLowerCase())?type.trim().toLowerCase():'apartment', price:Number(price.trim()), location:location.trim().toLowerCase(), beds:Number(beds.trim())||1, features:featuresRaw?featuresRaw.split('-').map(f=>f.trim()):[] });
          count++;
        }
      }
      setCsvStatus(f(`تم رفع ${count} وحدة بنجاح ✓`,`${count} units uploaded successfully ✓`));
      setCsvLoading(false);
      setTimeout(() => setCsvStatus(''), 4000);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:900,color:'#0f172a',margin:0 }}>{f('إدارة الوحدات','Manage Listings')}</h1>
          <p style={{ color:'#64748b',fontSize:13,marginTop:4 }}>{f(`وحداتي: ${props.length}`,`My units: ${props.length}`)}</p>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          {['list','add','csv'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`makan-listings-tab-btn${tab===t?' makan-listings-tab-btn--active':''}`}
              style={{
              padding:'8px 20px', borderRadius:10,
              border:`1.5px solid ${tab===t ? roleStyle.accent : 'rgba(220,224,240,0.9)'}`,
              background: tab===t ? `${roleStyle.accent}18` : 'rgba(255,255,255,0.8)',
              color: tab===t ? roleStyle.accent : '#6b7280',
              fontSize:13, fontWeight:700, cursor:'pointer',
              fontFamily:"'Tajawal','Segoe UI',sans-serif",
              boxShadow: tab===t ? `0 2px 10px ${roleStyle.accent}22` : '0 1px 4px rgba(0,0,0,0.04)',
              transition:'all .18s'
            }}>
              {t==='list' ? f('الوحدات','Units') : t==='add' ? f('إضافة يدوي','Add Manual') : f('رفع CSV','CSV Upload')}
            </button>
          ))}
        </div>
      </div>

      {selectedProp && <PropertyDetailModal prop={selectedProp} user={user} lang={lang} f={f} rtl={rtl} roleStyle={roleStyle} shortlist={[]} onClose={() => setSelectedProp(null)}/>}

      {tab === 'list' && (
        <div>
          {props.length === 0 ? (
            <div style={{ textAlign:'center',padding:'4rem',...GLASS,borderRadius:16,border:'1.5px dashed rgba(99,102,241,0.2)',color:'#94a3b8' }}>
              <Building2 size={48} style={{ opacity:.3,marginBottom:16 }}/>
              <p style={{ fontSize:16,fontWeight:700,color:'#999' }}>{f('لا توجد وحدات بعد','No units yet')}</p>
              <button onClick={() => setTab('add')} style={{ marginTop:16,background:roleStyle.accent,color:'#fff',border:'none',borderRadius:10,padding:'10px 24px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                {f('أضف وحدة','Add Unit')}
              </button>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {props.map(p => {
                const loc = LOCATIONS.find(l => l.id === p.location);
                const tc  = TYPE_COLORS[p.type] || TYPE_COLORS.apartment;
                const canDelete = user.role === 'admin' || user.role === 'superadmin' || p.agentId === user.agentId;
                return (
                  <div key={p.id} className="makan-card" style={{ ...GLASS,borderRadius:16,padding:'1rem 1.25rem',transition:'all .2s' }}>
                    {/* Top row */}
                    <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                      <div style={{ background:tc.bg,color:tc.text,borderRadius:10,width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <Home size={20}/>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        {p.projectName && <div style={{ fontSize:11,fontWeight:700,color:'#aaa',marginBottom:2 }}>{p.projectName}</div>}
                        <div style={{ fontSize:14,fontWeight:800,color:'#0f172a' }}>{p.title}</div>
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
                        {p.handover && (
                          <span style={{ fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:20,background: p.handover==='ready'?'#e8f5e9':'#fff8e1',color: p.handover==='ready'?'#2e7d32':'#f57c00',border:`1px solid ${p.handover==='ready'?'#c8e6c9':'#ffe082'}` }}>
                            {p.handover==='ready'?f('جاهزة','Ready'):f('على الخارطة','Off Plan')}
                          </span>
                        )}
                        <button onClick={() => setSelectedProp(p)} style={{ background:roleStyle.light,border:`1px solid ${roleStyle.accent}44`,borderRadius:8,padding:'5px 10px',cursor:'pointer',color:roleStyle.accent,display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700 }}>
                          <Eye size={13}/> {f('تفاصيل','Details')}
                        </button>
                        {canDelete && (
                          <button onClick={() => onDelete(p.id)} style={{ background:'#fff2f2',border:'1px solid #ffc8c8',borderRadius:8,padding:'5px 8px',cursor:'pointer',color:'#c62828',display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700 }}>
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Stats row */}
                    <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:8 }}>
                      <span style={{ ...tc,background:tc.bg,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20 }}>
                        {lang==='ar'?PROPERTY_TYPES.find(t=>t.id===p.type)?.ar:PROPERTY_TYPES.find(t=>t.id===p.type)?.en}
                      </span>
                      <span style={{ fontSize:11,color:'#999' }}>{loc?(lang==='ar'?loc.ar:loc.en):p.location}</span>
                      <span style={{ fontSize:11,color:'#999' }}>· {p.beds} {f('غرف','beds')}</span>
                      {p.size && <span style={{ fontSize:11,color:'#999' }}>· {Number(p.size).toLocaleString()} {f('قدم²','sqft')}</span>}
                    </div>
                    {/* Pricing row */}
                    <div style={{ display:'flex',gap:16,flexWrap:'wrap',alignItems:'center',marginBottom: (p.ownerName||p.ownerPhone||p.notes)?8:0 }}>
                      <div>
                        <div style={{ fontSize:10,color:'#bbb',fontWeight:600 }}>{f('السعر المطلوب','Asking')}</div>
                        <div style={{ fontSize:15,fontWeight:900,color:roleStyle.accent }}>{Number(p.price).toLocaleString()} <span style={{ fontSize:10,color:'#aaa' }}>AED</span></div>
                      </div>
                      {p.originalPrice && <div>
                        <div style={{ fontSize:10,color:'#bbb',fontWeight:600 }}>{f('السعر الأصلي','Original')}</div>
                        <div style={{ fontSize:13,fontWeight:700,color:'#475569' }}>{Number(p.originalPrice).toLocaleString()}</div>
                      </div>}
                      {p.premium && <div>
                        <div style={{ fontSize:10,color:'#bbb',fontWeight:600 }}>{f('البريميوم','Premium')}</div>
                        <div style={{ fontSize:13,fontWeight:700,color:'#e65100' }}>+{Number(p.premium).toLocaleString()}</div>
                      </div>}
                      <div style={{ marginRight:'auto',background:'rgba(241,245,249,0.7)',borderRadius:8,padding:'4px 10px',fontSize:10,fontWeight:700,color:'#888',textAlign:'center' }}>
                        <div>{p.agentId}</div>
                        <div style={{ fontSize:9,color:'#bbb' }}>{p.agentName}</div>
                      </div>
                    </div>
                    {/* Owner info — hidden from sales */}
                    {(p.ownerName || p.ownerPhone || p.notes) && (
                      <div style={{ background:'#fff8f5',borderRadius:10,padding:'8px 12px',border:'1px solid #ffe0cc',fontSize:12,display:'flex',gap:16,flexWrap:'wrap' }}>
                        {user.role !== 'sales' && p.ownerName  && <span style={{ color:'#c84b00',fontWeight:700,display:'flex',alignItems:'center',gap:5 }}><User size={12}/>{p.ownerName}</span>}
                        {user.role !== 'sales' && p.ownerPhone && <span style={{ color:'#c84b00',fontWeight:700 }}>📞 {p.ownerPhone}</span>}
                        {p.notes && <span style={{ color:'#888',fontStyle:'italic' }}>{p.notes}</span>}
                      </div>
                    )}
                    {/* Brochure link */}
                    {p.brochureUrl && (
                      <a href={p.brochureUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:roleStyle.accent,textDecoration:'none',background:roleStyle.light,borderRadius:8,padding:'4px 10px',border:`1px solid ${roleStyle.accent}33`,marginTop:4 }}>
                        <FileText size={12}/> {f('عرض البروشور','View Brochure')}
                      </a>
                    )}
                    {/* ── Reservation System ── */}
                    {p.reservedBy ? (
                      <div style={{ marginTop:8,background:'rgba(239,246,255,0.8)',border:'1px solid rgba(99,102,241,0.20)',borderRadius:10,padding:'8px 12px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
                        <Shield size={13} color={roleStyle.accent}/>
                        <span style={{ fontSize:12,fontWeight:700,color:roleStyle.accent }}>{f('محجوز بواسطة','Reserved by')} {p.reservedBy}</span>
                        <span style={{ fontSize:11,color:'#94a3b8' }}>· {elapsedTime(p.reservedAt, lang)}</span>
                        {user.role === 'admin' || user.role === 'superadmin' && (
                          <button onClick={() => onUpdate(p.id, { reservedBy: null, reservedAt: null, status: 'available' })} style={{ marginRight:'auto',marginLeft:'auto',background:'rgba(220,38,38,0.08)',border:'1px solid rgba(220,38,38,0.25)',borderRadius:8,padding:'4px 12px',cursor:'pointer',color:'#dc2626',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:5,fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                            <X size={11}/> {f('إلغاء الحجز','Revoke Reservation')}
                          </button>
                        )}
                      </div>
                    ) : user.role === 'sales' && (
                      <button onClick={() => onUpdate(p.id, { reservedBy:`${lang==='ar'?user.name:user.nameEn} (${user.agentId})`, reservedAt: new Date().toISOString(), status: 'reserved' })} style={{ marginTop:8,background:roleStyle.light,border:`1px solid ${roleStyle.accent}44`,borderRadius:8,padding:'6px 14px',cursor:'pointer',color:roleStyle.accent,fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:5,fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                        <CheckCircle2 size={13}/> {f('احجز الوحدة','Claim Unit')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'add' && (
        <div style={{ ...GLASS,borderRadius:20,padding:'1.75rem',maxWidth:600 }}>
          <h3 style={{ fontSize:16,fontWeight:800,color:'#0f172a',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:8 }}>
            <Plus size={18} color={roleStyle.accent}/> {f('إضافة وحدة جديدة','Add New Unit')}
          </h3>
          <form onSubmit={handleAdd} style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {/* ── Section: Basic Info ── */}
            <div style={{ fontSize:11,fontWeight:800,color:'#aaa',textTransform:'uppercase',letterSpacing:1,paddingBottom:4,borderBottom:'1px solid rgba(226,232,240,0.6)' }}>{f('معلومات الوحدة','Unit Info')}</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('اسم المشروع','Project Name')}</label>
                <input value={form.projectName} onChange={e=>fld('projectName',e.target.value)} placeholder={f('مثال: ياس غولف جيتس','e.g. Yas Golf Gates')} style={fInput}/>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('عنوان الوحدة (عربي)','Property Title (Arabic)')}</label>
                <input required value={form.title} onChange={e=>fld('title',e.target.value)} placeholder={f('مثال: شقة فاخرة في الريم','e.g. Luxury Apartment Al Reem')} style={fInput}/>
              </div>
              <div>
                <label style={fLabel}>{f('النوع','Type')}</label>
                <select value={form.type} onChange={e=>fld('type',e.target.value)} style={{...fSelect, direction: rtl?'rtl':'ltr'}}>
                  {PROPERTY_TYPES.filter(t=>t.id!=='all').map(t=><option key={t.id} value={t.id}>{lang==='ar'?t.ar:t.en}</option>)}
                </select>
              </div>
              <div>
                <label style={fLabel}>{f('الموقع','Location')}</label>
                <select value={form.location} onChange={e=>fld('location',e.target.value)} style={{...fSelect, direction: rtl?'rtl':'ltr'}}>
                  {LOCATIONS.filter(l=>l.id!=='all').map(l=><option key={l.id} value={l.id}>{lang==='ar'?l.ar:l.en}</option>)}
                </select>
              </div>
              <div>
                <label style={fLabel}>{f('عدد الغرف','Bedrooms')}</label>
                <input type="number" min={1} max={20} value={form.beds} onChange={e=>fld('beds',e.target.value)} style={fInput}/>
              </div>
              <div>
                <label style={fLabel}>{f('المساحة (قدم²)','Size (sqft)')}</label>
                <input type="number" min={1} value={form.size} onChange={e=>fld('size',e.target.value)} placeholder="0" style={fInput}/>
              </div>
              {/* Handover toggle */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('حالة التسليم','Handover Status')}</label>
                <div style={{ display:'flex',gap:8 }}>
                  {[{id:'ready',ar:'جاهزة',en:'Ready'},{id:'offplan',ar:'على الخارطة',en:'Off Plan'}].map(opt=>(
                    <button key={opt.id} type="button" onClick={()=>fld('handover',opt.id)} style={{
                      flex:1,padding:'9px 0',borderRadius:10,border:`1.5px solid ${form.handover===opt.id?roleStyle.accent:'#e0e3e9'}`,
                      background: form.handover===opt.id?`${roleStyle.accent}18`:'#fff',
                      color: form.handover===opt.id?roleStyle.accent:'#999',
                      fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Tajawal','Segoe UI',sans-serif",transition:'all .15s'
                    }}>{lang==='ar'?opt.ar:opt.en}</button>
                  ))}
                </div>
              </div>
              {/* Payment type toggle */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('طريقة الدفع','Payment Type')}</label>
                <div style={{ display:'flex',gap:8 }}>
                  {[{id:'cash',ar:'كاش',en:'Cash'},{id:'mortgage',ar:'تمويل عقاري',en:'Mortgage'}].map(opt=>(
                    <button key={opt.id} type="button" onClick={()=>fld('paymentType',opt.id)} style={{
                      flex:1,padding:'9px 0',borderRadius:10,border:`1.5px solid ${form.paymentType===opt.id?roleStyle.accent:'#e0e3e9'}`,
                      background: form.paymentType===opt.id?`${roleStyle.accent}18`:'#fff',
                      color: form.paymentType===opt.id?roleStyle.accent:'#999',
                      fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Tajawal','Segoe UI',sans-serif",transition:'all .15s'
                    }}>{lang==='ar'?opt.ar:opt.en}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Section: Pricing ── */}
            <div style={{ fontSize:11,fontWeight:800,color:'#aaa',textTransform:'uppercase',letterSpacing:1,paddingBottom:4,borderBottom:'1px solid rgba(226,232,240,0.6)',marginTop:4 }}>{f('التسعير','Pricing')}</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
              <div>
                <label style={fLabel}>{f('السعر المطلوب (AED)','Asking Price (AED)')}</label>
                <input required type="number" value={form.price} onChange={e=>fld('price',e.target.value)} placeholder="0" style={fInput}/>
              </div>
              <div>
                <label style={fLabel}>{f('السعر الأصلي (AED)','Original Price (AED)')}</label>
                <input type="number" value={form.originalPrice} onChange={e=>fld('originalPrice',e.target.value)} placeholder="0" style={fInput}/>
              </div>
              <div>
                <label style={fLabel}>{f('البريميوم (AED)','Premium (AED)')}</label>
                <input type="number" value={form.premium} onChange={e=>fld('premium',e.target.value)} placeholder="0" style={fInput}/>
              </div>
            </div>

            {/* ── Section: Details ── */}
            <div style={{ fontSize:11,fontWeight:800,color:'#aaa',textTransform:'uppercase',letterSpacing:1,paddingBottom:4,borderBottom:'1px solid rgba(226,232,240,0.6)',marginTop:4 }}>{f('تفاصيل إضافية','Additional Details')}</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('المميزات (مفصولة بفاصلة)','Features (comma separated)')}</label>
                <input value={form.features} onChange={e=>fld('features',e.target.value)} placeholder={f('مسبح، حديقة، جيم','Pool, Garden, Gym')} style={fInput}/>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('ملاحظات','Notes')}</label>
                <textarea value={form.notes} onChange={e=>fld('notes',e.target.value)} rows={3} placeholder={f('أي ملاحظات إضافية...','Any additional notes...')}
                  style={{ ...fInput, resize:'vertical', height:'auto' }}/>
              </div>
              {/* Brochure / Floorplan PDF upload — listing team only */}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('بروشور / مخطط الطابق (PDF)','Brochure / Floorplan PDF')}</label>
                <input ref={brochureInputRef} type="file" accept=".pdf,application/pdf" id="brochure-upload"
                  onChange={e => setBrochureFile(e.target.files[0] || null)} style={{ display:'none' }}/>
                <label htmlFor="brochure-upload" style={{
                  display:'flex',alignItems:'center',gap:10,
                  background: brochureFile ? 'rgba(79,70,229,0.06)' : 'rgba(255,255,255,0.6)',
                  border:`1.5px dashed ${brochureFile ? roleStyle.accent : 'rgba(226,232,240,0.8)'}`,
                  borderRadius:10,padding:'10px 14px',cursor:'pointer',
                  color: brochureFile ? roleStyle.accent : '#94a3b8',
                  fontSize:13,fontWeight:700,fontFamily:"'Tajawal','Segoe UI',sans-serif",transition:'all .2s'
                }}>
                  <FileText size={16}/>
                  {brochureFile ? brochureFile.name : f('اختر ملف PDF...','Choose PDF file...')}
                  {brochureFile && <span onClick={e=>{e.preventDefault();e.stopPropagation();setBrochureFile(null);if(brochureInputRef.current)brochureInputRef.current.value='';}} style={{ marginRight:'auto',marginLeft:'auto',color:'#94a3b8',fontSize:18,lineHeight:1,cursor:'pointer' }}>×</span>}
                </label>
              </div>
            </div>

            {/* ── Section: Owner Info (admin + listing only — hidden from sales) ── */}
            {user.role !== 'sales' && (<>
            <div style={{ fontSize:11,fontWeight:800,color:'#e65100',textTransform:'uppercase',letterSpacing:1,paddingBottom:4,borderBottom:'1px solid #fff3e0',marginTop:4,display:'flex',alignItems:'center',gap:6 }}>
              <Shield size={11} color="#e65100"/> {f('معلومات المالك — سرية','Owner Info — Confidential')}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,background:'rgba(255,237,213,0.35)',borderRadius:12,padding:'12px',border:'1px solid rgba(253,186,116,0.40)',backdropFilter:'blur(8px)' }}>
              <div>
                <label style={{ ...fLabel, color:'#e65100' }}>{f('اسم المالك','Owner Name')}</label>
                <input value={form.ownerName} onChange={e=>fld('ownerName',e.target.value)} placeholder={f('الاسم الكامل','Full name')} style={fInput}/>
              </div>
              <div>
                <label style={{ ...fLabel, color:'#e65100' }}>{f('رقم هاتف المالك','Owner Phone')}</label>
                <input type="tel" value={form.ownerPhone} onChange={e=>fld('ownerPhone',e.target.value)} placeholder="+971 xx xxx xxxx" style={fInput}/>
              </div>
              <div style={{ gridColumn:'1/-1',fontSize:11,color:'#e65100',opacity:.7,display:'flex',alignItems:'center',gap:5 }}>
                <EyeOff size={11}/> {f('هذه المعلومات غير مرئية لفريق المبيعات','This info is hidden from the Sales team')}
              </div>
            </div>
            </>)}

            <div style={{ background:roleStyle.light,borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,fontSize:13 }}>
              <User size={15} color={roleStyle.accent}/>
              <span style={{ color:'#475569' }}>{f('ستُنسب هذه الوحدة إلى:','This unit will be attributed to:')}</span>
              <span style={{ fontWeight:800,color:roleStyle.accent }}>{f(user.name,user.nameEn)} ({user.agentId})</span>
            </div>
            <button type="submit" disabled={uploading} style={{ background: uploading?'rgba(79,70,229,0.5)':`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`,color:'#fff',border:'none',borderRadius:12,padding:'12px',fontSize:15,fontWeight:700,cursor:uploading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
              {uploading?<RefreshCw size={18} style={{ animation:'spin 1s linear infinite' }}/>:<Plus size={18}/>}
              {uploading?f('جاري الرفع...','Uploading...'):f('إضافة للنظام','Add to System')}
            </button>
          </form>
        </div>
      )}

      {tab === 'csv' && (
        <div style={{ ...GLASS,borderRadius:20,padding:'1.75rem',maxWidth:560 }}>
          <h3 style={{ fontSize:16,fontWeight:800,color:'#0f172a',marginBottom:'1rem',display:'flex',alignItems:'center',gap:8 }}>
            <UploadCloud size={18} color={roleStyle.accent}/> {f('الرفع الجماعي عبر CSV','Bulk CSV Upload')}
          </h3>
          <div style={{ background:'rgba(238,242,255,0.5)',borderRadius:12,padding:'1rem',marginBottom:'1rem',border:'1px solid rgba(165,180,252,0.3)',backdropFilter:'blur(8px)' }}>
            <p style={{ fontSize:13,fontWeight:700,color:'#475569',marginBottom:8 }}>{f('ترتيب الأعمدة المطلوب:','Required column order:')}</p>
            <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:8 }}>
              {(lang==='ar'?['العنوان','النوع','السعر','الموقع','الغرف','المميزات']:['Title','Type','Price','Location','Beds','Features']).map((col,i) => (
                <React.Fragment key={i}>
                  <span style={{ background:'#fff',border:'1px solid #dde',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:700,color:'#444' }}>{col}</span>
                  {i<5&&<span style={{ color:'#bbb',fontSize:12 }}>,</span>}
                </React.Fragment>
              ))}
            </div>
            <p style={{ fontSize:11,color:'#888' }}>{f('* افصل المميزات بـ "-"','* Separate features with "-"')}</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} style={{ display:'none' }} id="csv-upload"/>
          <label htmlFor="csv-upload" style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10,background: csvLoading?'#f5f7fa':roleStyle.light,border:`2px dashed ${roleStyle.accent}66`,borderRadius:12,padding:'1.5rem',cursor: csvLoading?'not-allowed':'pointer',color:roleStyle.accent,fontWeight:700,fontSize:14,fontFamily:"'Tajawal','Segoe UI',sans-serif",transition:'all .2s' }}>
            {csvLoading ? <RefreshCw size={20} style={{ animation:'spin 1s linear infinite' }}/> : <FileText size={20}/>}
            {csvLoading ? f('جاري المعالجة...','Processing...') : f('اختر ملف CSV','Choose CSV File')}
          </label>
          {csvStatus && (
            <div style={{ marginTop:12,background:'#e8f5e9',border:'1px solid #c8e6c9',borderRadius:8,padding:'10px 14px',color:'#2e7d32',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:8 }}>
              <Check size={16}/> {csvStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SHORTLIST VIEW ───────────────────────────────────────────────────────────
function ShortlistView({ shortlist, allProps, user, lang, f, rtl, roleStyle, toggleShortlist, clearShortlist }) {
  const [clientName,  setClientName]  = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [exported,    setExported]    = useState(false);

  const shortlistedProps = allProps.filter(p => shortlist.includes(p.id));
  const totalValue = shortlistedProps.reduce((s, p) => s + Number(p.price || 0), 0);

  const handleExport = () => {
    if (shortlistedProps.length === 0) return;
    const html = generateProposalHTML(shortlistedProps, clientName, clientPhone, user, lang);
    const win  = window.open('', '_blank', 'width=960,height=750');
    if (!win) { alert(f('يرجى السماح بالنوافذ المنبثقة','Please allow pop-ups')); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 700);
    setExported(true);
    setTimeout(() => setExported(false), 3500);
  };

  return (
    <div>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:12 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:900,color:'#0f172a',margin:0,display:'flex',alignItems:'center',gap:10 }}>
            <BookmarkCheck size={22} color={roleStyle.accent}/>
            {f('قائمة العميل المختصرة','Client Shortlist')}
            {shortlist.length > 0 && (
              <span style={{ background:roleStyle.accent,color:'#fff',borderRadius:20,fontSize:12,fontWeight:900,padding:'2px 10px' }}>{shortlist.length}</span>
            )}
          </h1>
          <p style={{ color:'#aaa',fontSize:13,marginTop:5 }}>
            {shortlist.length === 0
              ? f('لم تختر أي وحدة — ابدأ بالبحث أو تصفح المخزون','No properties saved — use Match Engine or Inventory to add some')
              : f(`${shortlistedProps.length} وحدة · إجمالي: ${totalValue.toLocaleString()} AED`,`${shortlistedProps.length} unit(s) · Combined: ${totalValue.toLocaleString()} AED`)}
          </p>
        </div>
        {shortlist.length > 0 && (
          <button onClick={clearShortlist} style={{ background:'#fff2f2',border:'1px solid #ffc8c8',borderRadius:8,padding:'7px 14px',cursor:'pointer',color:'#c62828',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:6,fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
            <X size={13}/> {f('مسح الكل','Clear All')}
          </button>
        )}
      </div>

      {shortlist.length === 0 && (
        <div style={{ textAlign:'center',padding:'5rem 2rem',...GLASS,borderRadius:20,border:'2px dashed rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize:52,marginBottom:16,opacity:.35 }}>🔖</div>
          <p style={{ fontSize:17,fontWeight:800,color:'#bbb',marginBottom:8 }}>{f('قائمتك فارغة','Your shortlist is empty')}</p>
          <p style={{ fontSize:13,color:'#ccc',maxWidth:340,margin:'0 auto' }}>
            {f('اضغط على أيقونة الإشارة المرجعية على أي وحدة في محرك المطابقة أو في المخزون','Tap the bookmark icon on any property in the Match Engine or Inventory to add it here')}
          </p>
        </div>
      )}

      {shortlist.length > 0 && (
        <>
          <div style={{ ...GLASS,padding:'1.35rem',marginBottom:'1.25rem',display:'flex',gap:16,flexWrap:'wrap',alignItems:'flex-end' }}>
            <div style={{ flex:'1 1 200px' }}>
              <label style={{ fontSize:12,fontWeight:700,color:'#888',display:'block',marginBottom:6 }}>{f('اسم العميل (اختياري)','Client Name (optional)')}</label>
              <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder={f('مثال: محمد الشمري','e.g. Mohammed Al-Shamri')}
                onFocus={e=>e.target.style.borderColor=roleStyle.accent} onBlur={e=>e.target.style.borderColor='#e0e3e9'}
                style={{ width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e0e3e9',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:"'Tajawal','Segoe UI',sans-serif",transition:'border-color .2s' }}/>
            </div>
            <div style={{ flex:'1 1 180px' }}>
              <label style={{ fontSize:12,fontWeight:700,color:'#888',display:'block',marginBottom:6 }}>{f('رقم الهاتف (اختياري)','Phone (optional)')}</label>
              <input value={clientPhone} onChange={e=>setClientPhone(e.target.value)} placeholder="+971 50 000 0000" dir="ltr"
                onFocus={e=>e.target.style.borderColor=roleStyle.accent} onBlur={e=>e.target.style.borderColor='#e0e3e9'}
                style={{ width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid #e0e3e9',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:"'Tajawal','Segoe UI',sans-serif",transition:'border-color .2s' }}/>
            </div>
            <button onClick={handleExport} style={{
              background: exported ? 'linear-gradient(135deg,#2e7d32,#43a047)' : `linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`,
              color:'#fff', border:'none', borderRadius:12, padding:'10px 24px', fontSize:14, fontWeight:700,
              cursor:'pointer', display:'flex', alignItems:'center', gap:8,
              fontFamily:"'Tajawal','Segoe UI',sans-serif", whiteSpace:'nowrap',
              transition:'all .25s', boxShadow:`0 4px 14px ${roleStyle.accent}44`
            }}>
              {exported ? <Check size={16}/> : <Printer size={16}/>}
              {exported ? f('تم فتح نافذة الطباعة ✓','Print dialog opened ✓') : f('تصدير PDF للعميل','Export PDF Proposal')}
            </button>
          </div>

          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {shortlistedProps.map(p => {
              const loc = LOCATIONS.find(l => l.id === p.location);
              const tc  = TYPE_COLORS[p.type] || TYPE_COLORS.apartment;
              return (
                <div key={p.id} className="makan-card" style={{ ...GLASS,borderRadius:16,border:`1.5px solid rgba(79,70,229,0.20)`,padding:'1rem 1.25rem',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',transition:'all .22s' }}>
                  <div style={{ background:tc.bg,color:tc.text,borderRadius:10,width:46,height:46,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Home size={20}/>
                  </div>
                  <div style={{ flex:1,minWidth:180 }}>
                    <div style={{ display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap' }}>
                      <span style={{ ...tc,background:tc.bg,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,border:`1px solid ${tc.border}` }}>
                        {lang==='ar'?PROPERTY_TYPES.find(t=>t.id===p.type)?.ar:PROPERTY_TYPES.find(t=>t.id===p.type)?.en}
                      </span>
                      {p.matchScore && (
                        <span style={{ background:`${roleStyle.accent}18`,color:roleStyle.accent,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20 }}>
                          {p.matchScore}% {f('تطابق','match')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:14,fontWeight:800,color:'#0f172a',marginBottom:4 }}>{p.title}</div>
                    <div style={{ display:'flex',gap:12,fontSize:12,color:'#999',flexWrap:'wrap' }}>
                      <span style={{ display:'flex',alignItems:'center',gap:4 }}><MapPin size={11}/>{loc?(lang==='ar'?loc.ar:loc.en):p.location}</span>
                      <span style={{ display:'flex',alignItems:'center',gap:4 }}><BedDouble size={11}/>{p.beds} {f('غرف','beds')}</span>
                      <span style={{ fontWeight:800,color:roleStyle.accent }}>{Number(p.price).toLocaleString()} AED</span>
                    </div>
                  </div>
                  <button onClick={() => toggleShortlist(p.id)} style={{ background:'#fff2f2',border:'1px solid #ffc8c8',borderRadius:8,padding:'7px 12px',cursor:'pointer',color:'#c62828',display:'flex',alignItems:'center',gap:5,fontSize:12,fontWeight:700,flexShrink:0,fontFamily:"'Tajawal','Segoe UI',sans-serif",transition:'all .15s' }}>
                    <X size={13}/> {f('إزالة','Remove')}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── INVENTORY VIEW ───────────────────────────────────────────────────────────
function InventoryView({ props, lang, f, rtl, roleStyle, shortlist, toggleShortlist }) {
  const [search,        setSearch]        = useState('');
  const [filterType,    setFilterType]    = useState('all');
  const [filterLoc,     setFilterLoc]     = useState('all');
  const [filterHandover, setFilterHandover] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const filtered = props.filter(p => {
    const matchSearch   = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.titleEn||'').toLowerCase().includes(search.toLowerCase());
    const matchType     = filterType    === 'all' || p.type        === filterType;
    const matchLoc      = filterLoc     === 'all' || p.location    === filterLoc;
    const matchHandover = filterHandover === 'all' || p.handover   === filterHandover;
    const matchPayment  = filterPayment  === 'all' || p.paymentType === filterPayment;
    return matchSearch && matchType && matchLoc && matchHandover && matchPayment;
  });

  const savedCount = filtered.filter(p => shortlist.includes(p.id)).length;

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:12 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:900,color:'#0f172a',margin:0 }}>{f('مخزون الوحدات المتاحة','Available Inventory')}</h1>
          <p style={{ color:'#aaa',fontSize:13,marginTop:4 }}>
            {f(`${filtered.length} وحدة`,`${filtered.length} units`)} — {f('للمشاهدة فقط','View Only')}
            {savedCount > 0 && (
              <span style={{ marginRight: rtl?0:6,marginLeft: rtl?6:0,background:roleStyle.light,color:roleStyle.accent,borderRadius:20,padding:'1px 8px',fontSize:11,fontWeight:700 }}>
                {savedCount} {f('في قائمة العميل','in shortlist')}
              </span>
            )}
          </p>
        </div>
      </div>

      <div style={{ ...GLASS,borderRadius:16,padding:'1rem',marginBottom:'1rem',display:'flex',gap:12,flexWrap:'wrap',alignItems:'center' }}>
        <div style={{ position:'relative',flex:'1 1 200px' }}>
          <Search size={15} style={{ position:'absolute',top:11,left: rtl?'auto':12,right: rtl?12:'auto',color:'#bbb' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={f('بحث عن وحدة...','Search units...')}
            style={{ width:'100%',padding:`9px 12px 9px ${rtl?12:36}px`,borderRadius:10,border:'1.5px solid #e0e3e9',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:"'Tajawal','Segoe UI',sans-serif",direction: rtl?'rtl':'ltr' }}/>
        </div>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ padding:'9px 12px',borderRadius:10,border:'1.5px solid #e0e3e9',fontSize:13,outline:'none',fontFamily:"'Tajawal','Segoe UI',sans-serif",background:'#fff',direction: rtl?'rtl':'ltr' }}>
          {PROPERTY_TYPES.map(t=><option key={t.id} value={t.id}>{lang==='ar'?t.ar:t.en}</option>)}
        </select>
        <select value={filterLoc} onChange={e=>setFilterLoc(e.target.value)} style={{ padding:'9px 12px',borderRadius:10,border:'1.5px solid #e0e3e9',fontSize:13,outline:'none',fontFamily:"'Tajawal','Segoe UI',sans-serif",background:'#fff',direction: rtl?'rtl':'ltr' }}>
          {LOCATIONS.map(l=><option key={l.id} value={l.id}>{lang==='ar'?l.ar:l.en}</option>)}
        </select>
        <select value={filterHandover} onChange={e=>setFilterHandover(e.target.value)} style={{ padding:'9px 12px',borderRadius:10,border:'1.5px solid #e0e3e9',fontSize:13,outline:'none',fontFamily:"'Tajawal','Segoe UI',sans-serif",background:'#fff',direction: rtl?'rtl':'ltr' }}>
          {[{id:'all',ar:'جميع الحالات',en:'All Statuses'},{id:'ready',ar:'جاهزة',en:'Ready'},{id:'offplan',ar:'على الخارطة',en:'Off-Plan'}].map(o=><option key={o.id} value={o.id}>{lang==='ar'?o.ar:o.en}</option>)}
        </select>
        <select value={filterPayment} onChange={e=>setFilterPayment(e.target.value)} style={{ padding:'9px 12px',borderRadius:10,border:'1.5px solid #e0e3e9',fontSize:13,outline:'none',fontFamily:"'Tajawal','Segoe UI',sans-serif",background:'#fff',direction: rtl?'rtl':'ltr' }}>
          {[{id:'all',ar:'كل الدفع',en:'All Payments'},{id:'cash',ar:'كاش',en:'Cash'},{id:'mortgage',ar:'تمويل',en:'Mortgage'}].map(o=><option key={o.id} value={o.id}>{lang==='ar'?o.ar:o.en}</option>)}
        </select>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>
        {filtered.map(p => {
          const loc    = LOCATIONS.find(l => l.id === p.location);
          const tc     = TYPE_COLORS[p.type] || TYPE_COLORS.apartment;
          const inList = shortlist.includes(p.id);
          return (
            <div key={p.id} className="makan-card" style={{ ...GLASS,borderRadius:18,border:`1.5px solid ${inList?'rgba(79,70,229,0.35)':'rgba(255,255,255,0.60)'}`,overflow:'hidden',transition:'all .22s',boxShadow: inList?`0 8px 28px rgba(79,70,229,0.18), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)`:GLASS.boxShadow }}>
              <div style={{ background:`linear-gradient(135deg,${tc.bg},${tc.bg}88)`,height:80,display:'flex',alignItems:'center',justifyContent:'center',position:'relative' }}>
                <Home size={32} color={tc.text} style={{ opacity:.4 }}/>
                <span style={{ position:'absolute',top:10,right: rtl?'auto':10,left: rtl?10:'auto',...tc,background:tc.bg,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,border:`1px solid ${tc.border}` }}>
                  {lang==='ar'?PROPERTY_TYPES.find(t=>t.id===p.type)?.ar:PROPERTY_TYPES.find(t=>t.id===p.type)?.en}
                </span>
                <button onClick={() => toggleShortlist(p.id)} className="shortlist-btn" style={{ position:'absolute',bottom:8,right: rtl?'auto':8,left: rtl?8:'auto',background: inList?roleStyle.accent:'rgba(255,255,255,0.85)',border:`1.5px solid ${inList?roleStyle.accent:'#ddd'}`,borderRadius:8,padding:'4px 8px',cursor:'pointer',color: inList?'#fff':'#aaa',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,transition:'all .18s',fontFamily:"'Tajawal','Segoe UI',sans-serif",backdropFilter:'blur(4px)' }}>
                  {inList ? <BookmarkCheck size={12}/> : <Bookmark size={12}/>}
                  {inList ? f('محفوظة','Saved') : f('حفظ','Save')}
                </button>
              </div>
              <div style={{ padding:'1rem' }}>
                {p.projectName && <div style={{ fontSize:11,fontWeight:700,color:'#aaa',marginBottom:3 }}>{p.projectName}</div>}
                <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:6 }}>
                  <h4 style={{ fontSize:14,fontWeight:800,color:'#0f172a',margin:0,flex:1 }}>{p.title}</h4>
                  {p.handover && (
                    <span style={{ fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:20,flexShrink:0,background: p.handover==='ready'?'#e8f5e9':'#fff8e1',color: p.handover==='ready'?'#2e7d32':'#f57c00',border:`1px solid ${p.handover==='ready'?'#c8e6c9':'#ffe082'}` }}>
                      {p.handover==='ready'?f('جاهزة','Ready'):f('على الخارطة','Off Plan')}
                    </span>
                  )}
                </div>
                <div style={{ display:'flex',gap:8,fontSize:12,color:'#999',marginBottom:8,flexWrap:'wrap' }}>
                  <span style={{ display:'flex',alignItems:'center',gap:4 }}><MapPin size={11}/>{loc?(lang==='ar'?loc.ar:loc.en):p.location}</span>
                  <span style={{ display:'flex',alignItems:'center',gap:4 }}><BedDouble size={11}/>{p.beds} {f('غرف','beds')}</span>
                  {p.size && <span style={{ display:'flex',alignItems:'center',gap:4 }}>◻ {Number(p.size).toLocaleString()} {f('قدم²','sqft')}</span>}
                </div>
                {/* Pricing */}
                <div style={{ display:'flex',gap:10,marginBottom:8,flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:9,color:'#bbb',fontWeight:600 }}>{f('السعر المطلوب','Asking')}</div>
                    <div style={{ fontSize:16,fontWeight:900,color:roleStyle.accent }}>{Number(p.price).toLocaleString()} <span style={{ fontSize:10,fontWeight:600,color:'#aaa' }}>AED</span></div>
                  </div>
                  {p.originalPrice && <div>
                    <div style={{ fontSize:9,color:'#bbb',fontWeight:600 }}>{f('الأصلي','Original')}</div>
                    <div style={{ fontSize:13,fontWeight:700,color:'#475569' }}>{Number(p.originalPrice).toLocaleString()}</div>
                  </div>}
                  {p.premium && <div>
                    <div style={{ fontSize:9,color:'#bbb',fontWeight:600 }}>{f('البريميوم','Premium')}</div>
                    <div style={{ fontSize:13,fontWeight:700,color:'#e65100' }}>+{Number(p.premium).toLocaleString()}</div>
                  </div>}
                </div>
                {p.notes && <div style={{ fontSize:11,color:'#888',fontStyle:'italic',marginBottom:8,borderTop:'1px solid #f5f7fa',paddingTop:6 }}>{p.notes}</div>}
                <div style={{ display:'flex',justifyContent:'flex-end' }}>
                  <div style={{ background:'rgba(241,245,249,0.7)',borderRadius:8,padding:'4px 8px',fontSize:10,fontWeight:700,color:'#888',textAlign:'center' }}>
                    <div style={{ fontSize:9,color:'#bbb' }}>{f('الإيجنت','Agent')}</div>
                    {p.agentName}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TEAM VIEW ────────────────────────────────────────────────────────────────
function TeamView({ lang, f, rtl, roleStyle, allProps, users }) {
  const agents = users.filter(u=>u.role==='listing').map(u=>({
    ...u,
    unitCount:  allProps.filter(p=>p.agentId===u.agentId).length,
    totalValue: allProps.filter(p=>p.agentId===u.agentId).reduce((s,p)=>s+Number(p.price||0),0)
  }));
  const roleColors = { admin:'#6a1b9a', listing:'#185FA5', sales:'#2e7d32' };
  const allUsers = users;

  return (
    <div>
      <h1 className="makan-page-title" style={{ fontSize:22,fontWeight:900,color:'#0f172a',marginBottom:'1.5rem' }}>{f('فريق العمل','Team Overview')}</h1>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14,marginBottom:'2rem' }}>
        {agents.map(a => (
          <div key={a.agentId} className="makan-card" style={{ ...GLASS,padding:'1.4rem',transition:'all .22s' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
              <Avatar initials={a.avatar} size={44} color='#185FA5' bg='#e3f2fd'/>
              <div>
                <div className="makan-team-name" style={{ fontSize:15,fontWeight:800,color:'#0f172a' }}>{lang==='ar'?a.name:a.nameEn}</div>
                <div className="makan-agent-id" style={{ fontSize:11,color:'#aaa',fontFamily:'monospace' }}>{a.agentId}</div>
              </div>
            </div>
            <div style={{ display:'flex',gap:12 }}>
              <div style={{ flex:1,background:'rgba(79,70,229,0.06)',borderRadius:10,padding:'10px',textAlign:'center',border:'1px solid rgba(79,70,229,0.10)' }}>
                <div style={{ fontSize:22,fontWeight:900,color:PRIMARY,fontFamily:"'Inter',sans-serif" }}>{a.unitCount}</div>
                <div style={{ fontSize:10,color:'#94a3b8',fontWeight:700 }}>{f('وحدة','Units')}</div>
              </div>
              <div style={{ flex:1,background:'rgba(34,197,94,0.06)',borderRadius:10,padding:'10px',textAlign:'center',border:'1px solid rgba(34,197,94,0.12)' }}>
                <div style={{ fontSize:15,fontWeight:900,color:'#16a34a',fontFamily:"'Inter',sans-serif" }}>{(a.totalValue/1e6).toFixed(1)}M</div>
                <div style={{ fontSize:10,color:'#94a3b8',fontWeight:700 }}>AED</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="makan-card" style={{ ...GLASS,borderRadius:20,overflow:'hidden' }}>
        <div style={{ padding:'1.25rem',borderBottom:'1px solid rgba(226,232,240,0.6)' }}>
          <h3 className="makan-section-title" style={{ fontSize:13,fontWeight:800,color:'#0f172a',margin:0,fontFamily:"'Inter','Tajawal',sans-serif",letterSpacing:0.2 }}>{f('جميع المستخدمين','All Users')}</h3>
        </div>
        {allUsers.map((u,i) => (
          <div key={u.email} className="makan-team-row" style={{ display:'flex',alignItems:'center',gap:14,padding:'12px 1.25rem',borderBottom: i<allUsers.length-1?'1px solid rgba(226,232,240,0.4)':'none' }}>
            <Avatar initials={u.avatar} size={36} color={roleColors[u.role]} bg={roleColors[u.role]+'22'}/>
            <div style={{ flex:1 }}>
              <div className="makan-team-name" style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>{lang==='ar'?u.name:u.nameEn}</div>
              <div className="makan-team-email" style={{ fontSize:12,color:'#bbb',fontFamily:'monospace' }}>{u.email}</div>
            </div>
            <RoleBadge role={u.role} lang={lang}/>
            <div className="makan-agent-id" style={{ fontSize:11,fontFamily:'monospace',color:'#aaa',background:'rgba(241,245,249,0.7)',borderRadius:6,padding:'3px 8px' }}>{u.agentId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SHARED FORM STYLES ──────────────────────────────────────────────────────
const fLabel  = { fontSize:11,fontWeight:700,color:'#94a3b8',display:'block',marginBottom:6,letterSpacing:0.6,textTransform:'uppercase',fontFamily:"'Inter',sans-serif" };
const fInput  = { width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid rgba(226,232,240,0.8)',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:"'Tajawal','Segoe UI',sans-serif",background:'rgba(255,255,255,0.6)',transition:'border-color .2s',color:'#0f172a',backdropFilter:'blur(8px)' };
const fSelect = { width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid rgba(226,232,240,0.8)',fontSize:14,outline:'none',fontFamily:"'Tajawal','Segoe UI',sans-serif",background:'rgba(255,255,255,0.6)',color:'#0f172a',cursor:'pointer',backdropFilter:'blur(8px)' };

// ─── AGENTS PANEL ─────────────────────────────────────────────────────────────
function AgentsPanel({ users, onAddUser, onUpdateUser, onDeleteUser, lang, f, rtl, roleStyle, currentUser }) {
  const [view,          setView]          = useState('list');
  const [editId,        setEditId]        = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saveMsg,       setSaveMsg]       = useState('');
  const [showPass,      setShowPass]      = useState(false);
  const [showEditPass,  setShowEditPass]  = useState(false);
  const [form,     setForm]     = useState({ name:'', nameEn:'', email:'', password:'', role:'listing' });
  const [editForm, setEditForm] = useState({ name:'', nameEn:'', password:'', role:'listing' });

  const ROLE_META = {
    admin:   { ar:'مدير النظام',   en:'Admin',         color:'#6a1b9a', bg:'#f3e5f5', border:'#e9d5ff', prefix:'ADM' },
    listing: { ar:'فريق الليستنج',en:'Listing Agent', color:'#1565c0', bg:'#e3f2fd', border:'#bfdbfe', prefix:'AGT' },
    sales:   { ar:'فريق المبيعات',en:'Sales Agent',   color:'#2e7d32', bg:'#e8f5e9', border:'#bbf7d0', prefix:'SLS' },
  };

  const genAvatar = (nameEn, name) => {
    if (nameEn && nameEn.trim()) {
      const p = nameEn.trim().split(/\s+/);
      return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nameEn.slice(0, 2).toUpperCase();
    }
    return name ? name.slice(0, 2) : '??';
  };

  const genAgentId = (role) => {
    const meta   = ROLE_META[role] || ROLE_META.listing;
    const taken  = users.filter(u => u.agentId.startsWith(meta.prefix));
    const nums   = taken.map(u => parseInt(u.agentId.split('-')[1], 10)).filter(n => !isNaN(n));
    const next   = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `${meta.prefix}-${String(next).padStart(3, '0')}`;
  };

  const flash = (msg) => {
    setSaveMsg(msg || f('تم الحفظ بنجاح ✓', 'Saved successfully ✓'));
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;
    if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase().trim())) {
      flash(f('⚠ البريد الإلكتروني مستخدم بالفعل', '⚠ Email already in use')); return;
    }
    onAddUser({
      id:       'u' + Date.now(),
      email:    form.email.toLowerCase().trim(),
      password: form.password,
      role:     form.role,
      name:     form.name,
      nameEn:   form.nameEn || form.name,
      agentId:  genAgentId(form.role),
      avatar:   genAvatar(form.nameEn, form.name),
    });
    setForm({ name:'', nameEn:'', email:'', password:'', role:'listing' });
    setView('list');
    flash();
  };

  const startEdit = (u) => {
    setEditId(u.id);
    setEditForm({ name: u.name, nameEn: u.nameEn, password: '', role: u.role });
    setShowEditPass(false);
  };

  const handleSaveEdit = (id) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    onUpdateUser(id, {
      name:        editForm.name   || u.name,
      nameEn:      editForm.nameEn || u.nameEn,
      role:        editForm.role,
      avatar:      genAvatar(editForm.nameEn || u.nameEn, editForm.name || u.name),
      permissions: { ...DEFAULT_PERMISSIONS[editForm.role||'sales'], ...(editForm.permissions||{}) },
      ...(editForm.password ? { password: editForm.password } : {}),
    });
    setEditId(null);
    flash();
  };

  const handleDelete = (id) => {
    onDeleteUser(id);
    setConfirmDelete(null);
    flash(f('تم حذف المستخدم', 'User deleted'));
  };

  const counts = { admin: users.filter(u=>u.role==='admin'||u.role==='superadmin').length, listing: users.filter(u=>u.role==='listing').length, sales: users.filter(u=>u.role==='sales').length };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:12 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:900,color:'#0f172a',margin:0,display:'flex',alignItems:'center',gap:10 }}>
            <Shield size={22} color={roleStyle.accent}/>
            {f('إدارة المستخدمين والصلاحيات','User & Agent Management')}
          </h1>
          <p style={{ color:'#94a3b8',fontSize:13,marginTop:5 }}>
            {f(`${users.length} مستخدم في النظام — النظام حي ومتزامن`,`${users.length} users live — changes saved to system instantly`)}
          </p>
        </div>
        <div style={{ display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}>
          {saveMsg && (
            <span style={{ background: saveMsg.includes('⚠') ? '#fef3c7' : '#ecfdf5', color: saveMsg.includes('⚠') ? '#92400e' : '#065f46', border: `1px solid ${saveMsg.includes('⚠') ? '#fde68a' : '#a7f3d0'}`, borderRadius:10,padding:'7px 14px',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:6,transition:'all .3s' }}>
              {saveMsg.includes('⚠') ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>} {saveMsg}
            </span>
          )}
          <button onClick={() => { setView(v => v==='add'?'list':'add'); setEditId(null); }} style={{
            background: view==='add' ? 'rgba(254,242,242,0.9)' : `linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}bb)`,
            color: view==='add' ? '#dc2626' : '#fff',
            border: view==='add' ? '1.5px solid #fecaca' : 'none',
            borderRadius:12, padding:'10px 22px', fontSize:14, fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', gap:8, fontFamily:"'Tajawal','Segoe UI',sans-serif",
            boxShadow: view==='add' ? 'none' : `0 6px 20px ${roleStyle.accent}44`, transition:'all .22s'
          }}>
            {view==='add' ? <><X size={15}/>{f('إلغاء','Cancel')}</> : <><Plus size={15}/>{f('إضافة مستخدم','Add User')}</>}
          </button>
        </div>
      </div>

      {/* Role Summary Strip */}
      <div style={{ display:'flex',gap:12,marginBottom:'1.5rem',flexWrap:'wrap' }}>
        {Object.entries(ROLE_META).map(([role, meta]) => (
          <div key={role} style={{ ...GLASS,borderRadius:14,padding:'12px 18px',border:`1.5px solid rgba(255,255,255,0.70)`,display:'flex',alignItems:'center',gap:10,flex:'1 1 140px' }}>
            <div style={{ background:meta.bg,borderRadius:10,padding:8,color:meta.color }}><Shield size={16}/></div>
            <div>
              <div style={{ fontSize:22,fontWeight:900,color:meta.color,lineHeight:1 }}>{counts[role]}</div>
              <div style={{ fontSize:11,color:'#94a3b8',fontWeight:700,marginTop:2 }}>{f(meta.ar, meta.en)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Form */}
      {view === 'add' && (
        <div style={{ ...GLASS,borderRadius:20,border:`1.5px solid rgba(79,70,229,0.30)`,padding:'1.75rem',marginBottom:'1.5rem',boxShadow:`0 8px 36px rgba(79,70,229,0.12), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)` }}>
          <h3 style={{ fontSize:15,fontWeight:800,color:'#0f172a',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:8 }}>
            <Plus size={17} color={roleStyle.accent}/>{f('إضافة مستخدم جديد','Add New User')}
          </h3>
          <form onSubmit={handleAdd}>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14,marginBottom:18 }}>
              <div>
                <label style={fLabel}>{f('الاسم (عربي)','Arabic Name')}</label>
                <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder={f('مثال: سامي العلي','e.g. سامي العلي')} style={fInput}/>
              </div>
              <div>
                <label style={fLabel}>{f('الاسم (إنجليزي)','English Name')}</label>
                <input value={form.nameEn} onChange={e=>setForm({...form,nameEn:e.target.value})} placeholder="e.g. Sami Al-Ali" style={{...fInput,direction:'ltr'}}/>
              </div>
              <div>
                <label style={fLabel}>{f('البريد الإلكتروني','Email Address')}</label>
                <input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="user@apex.ae" style={{...fInput,direction:'ltr'}}/>
              </div>
              <div style={{ position:'relative' }}>
                <label style={fLabel}>{f('كلمة المرور','Password')}</label>
                <input required type={showPass?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 6 characters" style={{...fInput,paddingRight:38,direction:'ltr'}}/>
                <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute',bottom:11,right:10,background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0 }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              <div>
                <label style={fLabel}>{f('الدور الوظيفي','Role')}</label>
                <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={fSelect}>
                  {Object.entries(ROLE_META).map(([r, m]) => <option key={r} value={r}>{f(m.ar, m.en)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}>
              <button type="submit" style={{
                background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}bb)`,
                color:'#fff',border:'none',borderRadius:12,padding:'11px 28px',fontSize:14,fontWeight:700,
                cursor:'pointer',display:'flex',alignItems:'center',gap:8,
                fontFamily:"'Tajawal','Segoe UI',sans-serif",boxShadow:`0 6px 20px ${roleStyle.accent}44`
              }}>
                <Plus size={17}/>{f('إضافة للنظام','Add to System')}
              </button>
              <p style={{ fontSize:12,color:'#94a3b8' }}>
                {f('سيُنشأ رمز الإيجنت تلقائياً','Agent ID will be auto-generated')}
              </p>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {users.map(u => {
          const meta      = ROLE_META[u.role] || ROLE_META.listing;
          const isEditing = editId === u.id;
          const isSelf    = u.id === currentUser.id;

          return (
            <div key={u.id} style={{
              ...GLASS, borderRadius:18,
              border:`1.5px solid ${isEditing ? 'rgba(79,70,229,0.40)' : 'rgba(255,255,255,0.60)'}`,
              overflow:'hidden', transition:'all .22s',
              boxShadow: isEditing ? `0 8px 36px rgba(79,70,229,0.15), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.80)` : GLASS.boxShadow
            }}>
              {/* Row */}
              <div style={{ display:'flex',alignItems:'center',gap:14,padding:'1rem 1.4rem',flexWrap:'wrap' }}>
                <Avatar initials={u.avatar} size={46} color={meta.color} bg={meta.bg}/>
                <div style={{ flex:1,minWidth:200 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:5 }}>
                    <span style={{ fontSize:15,fontWeight:800,color:'#0f172a' }}>{lang==='ar'?u.name:u.nameEn}</span>
                    {isSelf && (
                      <span className="makan-you-badge" style={{ background:'#fef9c3',color:'#854d0e',fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:20,border:'1px solid #fde047' }}>
                        {f('حسابك','You')}
                      </span>
                    )}
                    <RoleBadge role={u.role} lang={lang}/>
                  </div>
                  <div style={{ display:'flex',gap:12,fontSize:12,color:'#94a3b8',flexWrap:'wrap',alignItems:'center' }}>
                    <span style={{ fontFamily:'monospace',color:'#64748b' }}>{u.email}</span>
                    <span className="makan-agent-id" style={{ background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:6,padding:'1px 8px',fontFamily:'monospace',fontSize:11,color:'#475569',fontWeight:700 }}>{u.agentId}</span>
                    <span style={{ display:'flex',alignItems:'center',gap:4,color:'#cbd5e1',letterSpacing:3,fontSize:14 }} title="Password stored securely">
                      {'●'.repeat(Math.min(u.password.length, 8))}
                    </span>
                  </div>
                </div>
                <div style={{ display:'flex',gap:8,flexShrink:0,alignItems:'center',flexWrap:'wrap' }}>
                  <button onClick={() => isEditing ? setEditId(null) : startEdit(u)} className="makan-btn-secondary" style={{
                    background: isEditing ? '#f1f5f9' : `${roleStyle.accent}14`,
                    border: `1.5px solid ${isEditing ? '#e2e8f0' : roleStyle.accent+'44'}`,
                    borderRadius:10, padding:'8px 16px', cursor:'pointer',
                    color: isEditing ? '#64748b' : roleStyle.accent,
                    fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6,
                    fontFamily:"'Cairo','Tajawal','Segoe UI',sans-serif", transition:'all .18s'
                  }}>
                    {isEditing ? <><X size={13}/>{f('إلغاء','Cancel')}</> : <><Settings size={13}/>{f('تعديل','Edit')}</>}
                  </button>

                  {!isSelf && (
                    confirmDelete === u.id ? (
                      <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                        <span style={{ fontSize:12,color:'#dc2626',fontWeight:700 }}>{f('تأكيد الحذف؟','Confirm delete?')}</span>
                        <button onClick={() => handleDelete(u.id)} style={{ background:'#dc2626',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:5,fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                          <Trash2 size={12}/>{f('حذف','Delete')}
                        </button>
                        <button onClick={() => setConfirmDelete(null)} style={{ background:'#f1f5f9',color:'#64748b',border:'1px solid #e2e8f0',borderRadius:8,padding:'7px 12px',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                          {f('لا','No')}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(u.id)} style={{ background:'rgba(254,242,242,0.85)',border:'1px solid #fecaca',borderRadius:10,padding:'8px 11px',cursor:'pointer',color:'#dc2626',display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700,fontFamily:"'Tajawal','Segoe UI',sans-serif",transition:'all .18s' }}>
                        <Trash2 size={13}/>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Inline Edit Form */}
              {isEditing && (
                <div style={{ padding:'1.35rem 1.4rem',borderTop:'1px solid rgba(226,232,240,0.6)',background:'rgba(238,242,255,0.30)',backdropFilter:'blur(12px)' }}>
                  <p style={{ fontSize:11,fontWeight:800,color:'#94a3b8',letterSpacing:1,marginBottom:14,textTransform:'uppercase' }}>
                    {f('تعديل بيانات','Edit Details')} — {u.email}
                  </p>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:12,marginBottom:16 }}>
                    <div>
                      <label style={fLabel}>{f('الاسم (عربي)','Arabic Name')}</label>
                      <input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} style={fInput}/>
                    </div>
                    <div>
                      <label style={fLabel}>{f('الاسم (إنجليزي)','English Name')}</label>
                      <input value={editForm.nameEn} onChange={e=>setEditForm({...editForm,nameEn:e.target.value})} style={{...fInput,direction:'ltr'}}/>
                    </div>
                    <div style={{ position:'relative' }}>
                      <label style={fLabel}>{f('كلمة مرور جديدة (اختياري)','New Password (optional)')}</label>
                      <input type={showEditPass?'text':'password'} value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})}
                        placeholder={f('اتركه فارغاً للإبقاء على الحالي','Leave blank to keep current')} style={{...fInput,paddingRight:38,direction:'ltr'}}/>
                      <button type="button" onClick={()=>setShowEditPass(!showEditPass)} style={{ position:'absolute',bottom:11,right:10,background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0 }}>
                        {showEditPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                    <div>
                      <label style={fLabel}>{f('الدور الوظيفي','Role')}</label>
                      <select value={editForm.role} onChange={e=>setEditForm({...editForm,role:e.target.value})} style={fSelect}>
                        {Object.entries(ROLE_META).map(([r, m]) => <option key={r} value={r}>{f(m.ar, m.en)}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Permissions — grouped */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.8,marginBottom:12,display:'flex',alignItems:'center',gap:6 }}>
                      <Shield size={12}/>{f('الصلاحيات','Permissions')}
                    </div>
                    {[
                      { key:'crm',   ar:'إدارة الليدات والمبيعات', en:'CRM & Sales',       color:'#3b82f6' },
                      { key:'prop',  ar:'العقارات',                  en:'Properties',        color:'#10b981' },
                      { key:'admin', ar:'الإدارة والإعدادات',        en:'Admin & Settings',  color:'#8b5cf6' },
                    ].map(grp => {
                      const grpPerms = PERMISSIONS_MAP.filter(p => p.group === grp.key);
                      const current = { ...DEFAULT_PERMISSIONS[u.role||'sales'], ...(editForm.permissions||{}) };
                      return (
                        <div key={grp.key} style={{ marginBottom:12 }}>
                          <div style={{ fontSize:10,fontWeight:800,color:grp.color,marginBottom:7,display:'flex',alignItems:'center',gap:5,textTransform:'uppercase',letterSpacing:.8 }}>
                            <div style={{ width:6,height:6,borderRadius:'50%',background:grp.color }}/>
                            {lang==='ar'?grp.ar:grp.en}
                          </div>
                          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                            {grpPerms.map(p => (
                              <label key={p.key} style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 10px',borderRadius:9,background:current[p.key]?`${grp.color}09`:'rgba(248,250,252,0.8)',border:`1px solid ${current[p.key]?`${grp.color}30`:'rgba(226,232,240,0.6)'}`,cursor:'pointer',transition:'all .12s' }}>
                                <input type="checkbox" checked={!!current[p.key]} onChange={e => setEditForm(prev => ({ ...prev, permissions:{ ...DEFAULT_PERMISSIONS[u.role||'sales'], ...(prev.permissions||{}), [p.key]:e.target.checked } }))} style={{ accentColor:grp.color, width:14, height:14, flexShrink:0 }}/>
                                <span style={{ fontSize:11,fontWeight:600,color:current[p.key]?grp.color:'#475569',lineHeight:1.3 }}>{lang==='ar'?p.ar:p.en}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display:'flex',gap:10,alignItems:'center' }}>
                    <button onClick={() => handleSaveEdit(u.id)} style={{
                      background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}bb)`,
                      color:'#fff',border:'none',borderRadius:11,padding:'10px 26px',fontSize:14,fontWeight:700,
                      cursor:'pointer',display:'flex',alignItems:'center',gap:8,
                      fontFamily:"'Tajawal','Segoe UI',sans-serif",boxShadow:`0 5px 18px ${roleStyle.accent}44`
                    }}>
                      <Check size={16}/>{f('حفظ التعديلات','Save Changes')}
                    </button>
                    {!isSelf && editForm.password && (
                      <span style={{ fontSize:12,color:'#f59e0b',fontWeight:700,display:'flex',alignItems:'center',gap:5 }}>
                        <AlertCircle size={13}/>{f('سيتغير رمز الدخول فوراً','Password will change immediately')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
function MobileBottomNav({ activeTab, setActiveTab, user, leads, shortlist, f, rtl, navItems, darkMode }) {
  const [showMore, setShowMore] = useState(false);
  const PRIMARY = '#1a3aff';

  // Priority order changes by role
  const priorityByRole = {
    admin:   ['dashboard','listings','leads','chat','calendar'],
    listing: ['listings','chat','calendar','tasks','feed'],
    sales:   ['search','leads','shortlist','chat','calendar'],
  };
  const priority = priorityByRole[user?.role] || ['listings','chat','calendar','tasks','feed'];
  const bottomTabs = priority.map(id => navItems.find(n => n.id === id)).filter(Boolean).slice(0, 5);
  const remainingTabs = navItems.filter(n => !bottomTabs.find(b => b.id === n.id));

  return (
    <>
      {/* Bottom nav bar */}
      <div className="makan-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: darkMode ? '#090e1c' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: darkMode ? '1px solid #3e4f72' : '1px solid rgba(226,232,240,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '6px 0 calc(6px + env(safe-area-inset-bottom))',
        boxShadow: darkMode ? '0 -4px 20px rgba(0,0,0,0.4)' : '0 -4px 20px rgba(0,0,0,0.08)',
      }}>
        {bottomTabs.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setShowMore(false); }} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: isActive ? PRIMARY : darkMode ? '#9aabcc' : '#64748b',
              position: 'relative', minWidth: 52,
            }}>
              <div style={{
                background: isActive ? (darkMode ? 'rgba(26,58,255,0.18)' : 'rgba(26,58,255,0.10)') : 'transparent',
                borderRadius: 10, padding: '5px 10px', transition: 'all .15s',
              }}>
                {React.cloneElement(item.icon, { size: 20, strokeWidth: isActive ? 2.5 : 1.8 })}
              </div>
              <span style={{ fontSize: 9, fontWeight: isActive ? 800 : 600, whiteSpace: 'nowrap' }}>
                {rtl ? item.ar : item.en}
              </span>
              {item.id === 'leads' && leads.length > 0 && (
                <span style={{ position:'absolute', top:2, right:6, background:'#1a3aff', color:'#fff', borderRadius:'50%', width:14, height:14, fontSize:8, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {leads.length > 9 ? '9+' : leads.length}
                </span>
              )}
              {item.id === 'shortlist' && shortlist.length > 0 && (
                <span style={{ position:'absolute', top:2, right:6, background:'#e53935', color:'#fff', borderRadius:'50%', width:14, height:14, fontSize:8, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {shortlist.length > 9 ? '9+' : shortlist.length}
                </span>
              )}
            </button>
          );
        })}

        {/* More button */}
        <button onClick={() => setShowMore(!showMore)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '4px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'transparent',
          color: showMore ? PRIMARY : darkMode ? '#9aabcc' : '#64748b',
          minWidth: 52,
        }}>
          <div style={{
            background: showMore ? (darkMode ? 'rgba(26,58,255,0.18)' : 'rgba(26,58,255,0.10)') : 'transparent',
            borderRadius: 10, padding: '5px 10px',
          }}>
            <Grid size={20} strokeWidth={showMore ? 2.5 : 1.8}/>
          </div>
          <span style={{ fontSize: 9, fontWeight: showMore ? 800 : 600 }}>{rtl ? 'المزيد' : 'More'}</span>
        </button>
      </div>

      {/* More drawer */}
      {showMore && (
        <div onClick={() => setShowMore(false)} style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', bottom: 68, left: 12, right: 12,
            background: darkMode ? '#0d1526' : '#fff',
            borderRadius: 20, padding: '1rem',
            border: darkMode ? '1px solid #3e4f72' : '1px solid rgba(226,232,240,0.8)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            maxHeight: '60vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {remainingTabs.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setShowMore(false); }} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '12px 8px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: isActive
                      ? (darkMode ? 'rgba(26,58,255,0.18)' : 'rgba(26,58,255,0.08)')
                      : (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.8)'),
                    color: isActive ? PRIMARY : darkMode ? '#9aabcc' : '#475569',
                    transition: 'all .15s',
                  }}>
                    {React.cloneElement(item.icon, { size: 22 })}
                    <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
                      {rtl ? item.ar : item.en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, user, lang, f, rtl, leads, shortlist, salesRequests, automations, handleLogout, collapsed, setCollapsed, setLang, syncStatus, currency, onSaveCurrency, darkMode, onToggleDark }) {
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showLangPicker,     setShowLangPicker]     = useState(false);

  // Permission helper inside sidebar
  const hasPerm = (item) => {
    if (!item.perm) return true;
    return item.perm(user);
  };

  const sections = [
    { items: [
      { id:'dashboard',      icon:<BarChart3 size={17}/>,     ar:'لوحة التحكم',     en:'Dashboard',      perm: u=>u.role==='admin'||u.role==='superadmin'||can(u,'view_dashboard') },
    ]},
    { label:{ar:'العقارات',en:'Properties'}, items: [
      { id:'listings',       icon:<Building2 size={17}/>,     ar:'إدارة الوحدات',   en:'Manage Units'    },
      { id:'search',         icon:<Search size={17}/>,        ar:'محرك البحث',      en:'Match Engine'    },
      { id:'shortlist',      icon:<Bookmark size={17}/>,      ar:'قائمة العميل',    en:'Shortlist',      badge: shortlist.length },
    ]},
    { label:{ar:'CRM',en:'CRM'}, items: [
      { id:'leads',          icon:<Kanban size={17}/>,        ar:'الليدات',         en:'Leads CRM',      badge: leads.filter(l=>l.stage==='unassigned').length, perm: u=>u.role==='admin'||u.role==='superadmin'||can(u,'view_leads') },
      { id:'sales_requests', icon:<ClipboardList size={17}/>, ar:'طلبات المبيعات',  en:'Sales Requests', badge: salesRequests.filter(r=>r.stage==='new_req').length },
      { id:'orgchart',       icon:<Network size={17}/>,       ar:'هيكل الشركة',    en:'Org Chart',      perm: u=>u.role==='admin'||u.role==='superadmin'||can(u,'view_org') },
    ]},
    { label:{ar:'الفريق',en:'Team'}, items: [
      { id:'team',           icon:<Users size={17}/>,         ar:'فريق العمل',      en:'Team Overview',  perm: u=>u.role==='admin'||u.role==='superadmin'||can(u,'view_team') },
      { id:'agents',         icon:<Shield size={17}/>,        ar:'المستخدمون',      en:'Users & Roles',  perm: u=>u.role==='admin'||u.role==='superadmin'||can(u,'manage_users') },
    ]},
    { label:{ar:'ذكاء وأتمتة',en:'AI & Automation'}, items: [
      { id:'automations',    icon:<Zap size={17}/>,           ar:'الأتمتة',         en:'Automations',    badge: automations.filter(a=>a.enabled).length, perm: u=>u.role==='admin'||u.role==='superadmin'||can(u,'manage_automations') },
      { id:'ai_chat',        icon:<Bot size={17}/>,           ar:'مساعد AI',        en:'AI Assistant'    },
    ]},
    { label:{ar:'التواصل',en:'Communication'}, items: [
      { id:'chat',     icon:<MessageSquare size={17}/>, ar:'المحادثات',  en:'Team Chat'        },
      { id:'feed',     icon:<Activity size={17}/>,      ar:'الإعلانات', en:'Announcements'    },
      { id:'tasks',    icon:<CheckSquare size={17}/>,   ar:'المهام',     en:'Tasks'            },
      { id:'calendar', icon:<Clock size={17}/>,         ar:'التقويم',    en:'Calendar'         },
    ]},
    { label:{ar:'التطوير',en:'Development'}, items: [
      { id:'academy', icon:<Award size={17}/>, ar:'أكاديمية مَكَان', en:'MAKAN Academy' },
    ]},
    { label:{ar:'الإعدادات',en:'Settings'}, items: [
      { id:'tools',          icon:<Calculator size={17}/>,        ar:'الأدوات',          en:'Tools',          perm: _=>true },
      { id:'notes',          icon:<StickyNote size={17}/>,        ar:'الملاحظات',         en:'Notes',          perm: _=>true },
      { id:'marketing',      icon:<Megaphone size={17}/>,         ar:'التسويق',            en:'Marketing',      perm: u=>u.role==='admin'||u.role==='superadmin' },
      { id:'bulkmail',       icon:<Mail size={17}/>,              ar:'بريد جماعي',      en:'Bulk Mail',      perm: u=>u.role==='admin'||u.role==='superadmin'||can(u,'bulk_mail') },
      { id:'whatsapp_camp',  icon:<MessageCircle size={17}/>,     ar:'واتساب كامبين',   en:'WhatsApp',       perm: u=>u.role==='admin'||u.role==='superadmin' },
      { id:'smtp',           icon:<Settings size={17}/>,          ar:'إعدادات البريد',  en:'SMTP Settings',  perm: u=>u.role==='admin'||u.role==='superadmin'||can(u,'smtp_settings') },
      { id:'superadmin',     icon:<Building2 size={17}/>,         ar:'إدارة الوكالات',  en:'Agencies',       perm: u=>u.role==='superadmin' },
    ]},
    { label:{ar:'الدعم',en:'Support'}, items: [
      { id:'support_ig', icon:<ExternalLink size={17}/>, ar:'Instagram', en:'Instagram', isLink:true, href:'https://www.instagram.com/makan.uae?igsh=MWw2dXo0bmVhZ3B2OA==' },
    ]},
  ];
  const w = collapsed ? 64 : 240;

  return (
    <div className="makan-sidebar" style={{ width:w, minWidth:w, height:'100vh', position:'sticky', top:0, background:'linear-gradient(180deg,#0f172a 0%,#1a1040 100%)', display:'flex', flexDirection:'column', transition:'width .22s cubic-bezier(.4,0,.2,1)', overflowX:'hidden', overflowY:'auto', zIndex:50, flexShrink:0 }}>
      <style>{`.sb-btn:hover{background:rgba(99,102,241,0.15)!important;color:#a5b4fc!important}.sb-link:hover{background:rgba(99,102,241,0.15)!important;color:#a5b4fc!important}html.dark-mode .sb-btn:hover{background:rgba(26,58,255,0.18)!important;color:#ffffff!important}html.dark-mode .sb-link:hover{background:rgba(26,58,255,0.12)!important;color:#9aabcc!important}`}</style>

      {/* Logo + toggle */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:collapsed?'center':'space-between', padding:collapsed?'18px 0':'20px 14px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, minHeight:68, overflow:'visible' }}>
        {!collapsed && <img src="./logo.png" alt="مكان" style={{ height:62, width:'auto', filter:'brightness(0) invert(1)', maxWidth:170 }} />}
        <button onClick={()=>setCollapsed(!collapsed)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:9, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8', flexShrink:0 }}>
          {collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}
        </button>
      </div>

      {/* Nav */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 8px' }}>
        {sections.map((sec, si) => (
          <div key={si} style={{ marginBottom:4 }}>
            {sec.label && !collapsed && (
              <div style={{ fontSize:9, fontWeight:800, color:'#334155', textTransform:'uppercase', letterSpacing:1.5, padding:'8px 8px 4px', whiteSpace:'nowrap' }}>
                {f(sec.label.ar, sec.label.en)}
              </div>
            )}
            {sec.items.map(item => {
              if (item.isLink) {
                return (
                  <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer" className="sb-link"
                    title={collapsed?(lang==='ar'?item.ar:item.en):undefined}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:collapsed?'10px 0':'9px 10px', justifyContent:collapsed?'center':'flex-start', borderRadius:11, textDecoration:'none', color:'#64748b', marginBottom:2, transition:'all .12s' }}>
                    <div style={{ color:'#6b7a99', flexShrink:0 }}>{item.icon}</div>
                    {!collapsed && <span style={{ fontSize:12, fontWeight:500, whiteSpace:'nowrap', flex:1, textAlign:rtl?'right':'left' }}>{f(item.ar, item.en)}</span>}
                    {!collapsed && <ExternalLink size={9} style={{ opacity:.4, flexShrink:0 }}/>}
                  </a>
                );
              }
              const isActive = activeTab === item.id;
              const allowed  = hasPerm(item);
              return (
                <button key={item.id} className={allowed?'sb-btn':''} onClick={()=>{ if(allowed) setActiveTab(item.id); }}
                  title={collapsed?(lang==='ar'?item.ar:item.en):undefined}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:collapsed?'10px 0':'9px 10px', justifyContent:collapsed?'center':'flex-start', borderRadius:11, border:'none', cursor:allowed?'pointer':'not-allowed', background:isActive&&allowed?'rgba(99,102,241,0.22)':'transparent', color:isActive&&allowed?'#a5b4fc':allowed?'#64748b':'#334155', marginBottom:2, transition:'all .12s', position:'relative', boxShadow:isActive&&allowed?'inset 0 0 0 1px rgba(99,102,241,0.35)':'none', opacity:allowed?1:0.45 }}>
                  <div style={{ color:isActive&&allowed?'#a5b4fc':allowed?'#475569':'#2d3a52', flexShrink:0, position:'relative' }}>
                    {item.icon}
                    {collapsed && allowed && item.badge > 0 && (
                      <span style={{ position:'absolute', top:-7, right:-7, background:'#4F46E5', color:'#fff', borderRadius:'50%', width:15, height:15, fontSize:8, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #0f172a' }}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  {!collapsed && <span style={{ fontSize:12, fontWeight:isActive&&allowed?700:500, whiteSpace:'nowrap', flex:1, textAlign:rtl?'right':'left' }}>{f(item.ar, item.en)}</span>}
                  {!collapsed && !allowed && <Shield size={11} style={{ flexShrink:0, opacity:.5 }}/>}
                  {!collapsed && allowed && item.badge > 0 && (
                    <span style={{ background:isActive?'#6366f1':'#4F46E5', color:'#fff', borderRadius:20, fontSize:9, fontWeight:900, padding:'1px 6px', minWidth:16, textAlign:'center', flexShrink:0, lineHeight:1.6 }}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
            {si < sections.length-1 && !collapsed && sec.label && <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'6px 0' }}/>}
          </div>
        ))}
      </div>

      {/* Language Picker Popup */}
      {showLangPicker && !collapsed && (
        <div style={{ position:'absolute', bottom:170, left:244, background:'#1e293b', borderRadius:14, border:'1px solid rgba(255,255,255,0.10)', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:300, minWidth:175, overflow:'hidden' }}>
          <div style={{ padding:'8px 14px', fontSize:10, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Language</div>
          {LANGS.map(l => (
            <button key={l.id} onClick={()=>{setLang(l.id);setShowLangPicker(false);}} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 14px', background:lang===l.id?'rgba(99,102,241,0.20)':'transparent', border:'none', cursor:'pointer', color:lang===l.id?'#a5b4fc':'#94a3b8', fontSize:12, fontWeight:lang===l.id?700:500, textAlign:'left' }}>
              <span style={{ fontSize:15 }}>{l.flag}</span>
              <span style={{ flex:1 }}>{l.name}</span>
              {lang===l.id && <Check size={12}/>}
            </button>
          ))}
        </div>
      )}

      {/* Currency Picker Popup */}
      {showCurrencyPicker && !collapsed && (
        <div style={{ position:'absolute', bottom:170, left:244, background:'#1e293b', borderRadius:14, border:'1px solid rgba(255,255,255,0.10)', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:300, minWidth:210, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', fontSize:10, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{f('اختر العملة','Select Currency')}</div>
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={()=>{onSaveCurrency(c);setShowCurrencyPicker(false);}} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 14px', background:currency.code===c.code?'rgba(99,102,241,0.20)':'transparent', border:'none', cursor:'pointer', color:currency.code===c.code?'#a5b4fc':'#94a3b8', fontSize:12, fontWeight:currency.code===c.code?700:500, textAlign:'left' }}>
              <span>{c.flag}</span>
              <span style={{ flex:1 }}>{lang==='ar'?c.nameAr:c.nameEn}</span>
              <span style={{ fontFamily:'monospace', fontSize:10, opacity:.7 }}>{c.code}</span>
              {currency.code===c.code && <Check size={12}/>}
            </button>
          ))}
        </div>
      )}

      {/* Bottom: sync + currency + lang + user + logout */}
      <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0, position:'relative' }}>
        {!collapsed && (
          <div style={{ display:'flex', gap:5, marginBottom:8, alignItems:'center' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:syncStatus==='synced'?'#16a34a':'#f59e0b', boxShadow:`0 0 6px ${syncStatus==='synced'?'#16a34a':'#f59e0b'}` }}/>
            <span style={{ fontSize:9, color:'#475569', fontWeight:600 }}>{syncStatus==='synced'?f('متزامن','Synced'):f('يتصل...','Connecting')}</span>
            <div style={{ flex:1 }}/>
            <button onClick={()=>{setShowCurrencyPicker(!showCurrencyPicker);setShowLangPicker(false);}} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'4px 9px', cursor:'pointer', color:'#94a3b8', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', gap:4 }} title={f('تغيير العملة','Change Currency')}>
              <span style={{ fontSize:11 }}>{CURRENCIES.find(c=>c.code===currency.code)?.flag||'🇦🇪'}</span>
              <span>{currency.code}</span>
            </button>
            <button onClick={()=>{setShowLangPicker(!showLangPicker);setShowCurrencyPicker(false);}} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'4px 9px', cursor:'pointer', color:'#94a3b8', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', gap:4 }} title={f('تغيير اللغة','Change Language')}>
              <Globe size={11}/>
              <span style={{ fontSize:11 }}>{LANGS.find(l=>l.id===lang)?.flag||'🌐'}</span>
            </button>
            <button onClick={onToggleDark} style={{ background: darkMode?'rgba(245,166,35,0.15)':'rgba(255,255,255,0.08)', border:`1px solid ${darkMode?'rgba(245,166,35,0.3)':'rgba(255,255,255,0.12)'}`, borderRadius:8, padding:'4px 9px', cursor:'pointer', color: darkMode?'#f5a623':'#94a3b8', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }} title={darkMode?f('وضع النهار','Light Mode'):f('الوضع الداكن','Dark Mode')}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        )}
        <div onClick={()=>setActiveTab('profile')} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 8px', borderRadius:11, background: activeTab==='profile'?'rgba(99,102,241,0.18)':'rgba(255,255,255,0.05)', overflow:'hidden', cursor:'pointer', transition:'all .15s' }}>
          {user.photoUrl
            ? <img src={user.photoUrl} alt="" style={{ width:30,height:30,borderRadius:'50%',objectFit:'cover',flexShrink:0,border:'1.5px solid rgba(165,180,252,0.4)' }}/>
            : <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(99,102,241,0.28)', display:'flex', alignItems:'center', justifyContent:'center', color:'#a5b4fc', fontSize:11, fontWeight:900, flexShrink:0 }}>{user.avatar}</div>
          }
          {!collapsed && (
            <>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lang==='ar'?user.name:user.nameEn}</div>
                <div style={{ fontSize:9, color:'#6366f1', fontWeight:600 }}>{user.jobTitle || f('عرض البروفايل','View Profile')}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();handleLogout();}} style={{ background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.20)', borderRadius:8, padding:'5px 7px', cursor:'pointer', color:'#f87171', display:'flex', alignItems:'center', flexShrink:0 }}>
                <LogOut size={13}/>
              </button>
            </>
          )}
        </div>
        {collapsed && <button onClick={handleLogout} style={{ width:'100%', marginTop:6, background:'rgba(220,38,38,0.10)', border:'none', borderRadius:9, padding:'8px', cursor:'pointer', color:'#f87171', display:'flex', alignItems:'center', justifyContent:'center' }}><LogOut size={14}/></button>}
      </div>
    </div>
  );
}

// ─── SALES REQUESTS VIEW ──────────────────────────────────────────────────────
function SalesRequestsView({ lang, f, rtl, roleStyle, requests, onAdd, onUpdate, onDelete, users, allProperties, currentUser, salesStages, onSaveStages }) {
  const [dragId,        setDragId]        = useState(null);
  const [dragOver,      setDragOver]      = useState(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [view,          setView]          = useState('kanban');
  const [showFilters,   setShowFilters]   = useState(false);
  const [showStagesMgr, setShowStagesMgr] = useState(false);
  const [editingStage,  setEditingStage]  = useState(null);
  const [filters,       setFilters]       = useState({ stage:'all', agentId:'all', dateFrom:'', dateTo:'' });
  const emptyForm = { clientName:'', phone:'', propType:'apartment', location:'all', beds:2, budget:'', notes:'', agentId:'', stage: salesStages[0]?.id||'new_req' };
  const [form, setForm] = useState(emptyForm);

  const canManage = currentUser?.role === 'admin' || can(currentUser||{}, 'manage_sales_req');

  // Sales users only see their own requests; admin sees all
  const visibleRequests = canManage
    ? requests
    : requests.filter(r => !r.agentId || r.agentId === currentUser?.agentId || r.agentId === currentUser?.id);

  const filtered = visibleRequests.filter(r => {
    if (filters.stage !== 'all' && r.stage !== filters.stage) return false;
    if (filters.agentId !== 'all' && r.agentId !== filters.agentId) return false;
    if (filters.dateFrom && r.createdAt < filters.dateFrom) return false;
    if (filters.dateTo && r.createdAt > filters.dateTo + 'T23:59:59') return false;
    return true;
  });
  const stageLeads = sid => filtered.filter(r=>r.stage===sid);

  const activeFilterCount = [filters.stage!=='all', filters.agentId!=='all', !!filters.dateFrom, !!filters.dateTo].filter(Boolean).length;

  const handleAdd = () => {
    if (!form.clientName) return;
    const agent = users.find(u=>u.agentId===form.agentId);
    onAdd({ ...form, id:'sr'+Date.now(), budget:form.budget?Number(String(form.budget).replace(/,/g,'')):0, agentName:agent?(lang==='ar'?agent.name:agent.nameEn):'', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() });
    setForm({...emptyForm, stage:salesStages[0]?.id||'new_req'}); setShowAdd(false);
  };

  const totalReqs    = filtered.length;
  const totalBudget  = filtered.reduce((s,r)=>s+(Number(r.budget)||0),0);
  const byStage      = salesStages.map(s=>({...s, count:filtered.filter(r=>r.stage===s.id).length}));
  const byAgent      = users.filter(u=>u.role!=='admin').map(u=>({...u, count:filtered.filter(r=>r.agentId===u.agentId).length})).filter(u=>u.count>0);

  return (
    <div dir={rtl?'rtl':'ltr'}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:10 }}>
            <ClipboardList size={22} color={roleStyle.accent}/>{f('طلبات المبيعات','Sales Requests')}
          </h1>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>
            {filtered.length} {f('طلب','requests')}{requests.length!==filtered.length?` (${f('مفلتر','filtered')})`:''}
          </p>
        </div>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
          {/* View toggle */}
          <div className="makan-view-toggle" style={{ display:'flex', background:'#f1f5f9', borderRadius:10, padding:3, gap:2 }}>
            {[['kanban',<Kanban size={12}/>,f('كانبان','Kanban')],['report',<BarChart3 size={12}/>,f('تقرير','Report')]].map(([v,ic,lb])=>(
              <button key={v} onClick={()=>setView(v)} className={`makan-view-btn${view===v?' makan-view-btn--active':''}`} style={{ padding:'5px 13px', borderRadius:8, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:5, background:view===v?'#fff':'transparent', color:view===v?PRIMARY:'#64748b', boxShadow:view===v?'0 1px 4px rgba(0,0,0,0.10)':'none', transition:'all .12s' }}>
                {ic} {lb}
              </button>
            ))}
          </div>
          {/* Filter */}
          <button onClick={()=>setShowFilters(!showFilters)} className="makan-btn-tool" style={{ background:activeFilterCount>0?PRIMARY:'rgba(255,255,255,0.8)', color:activeFilterCount>0?'#fff':'#64748b', border:`1.5px solid ${activeFilterCount>0?PRIMARY:'rgba(226,232,240,0.8)'}`, borderRadius:10, padding:'7px 13px', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <Filter size={12}/>{f('فلتر','Filter')}{activeFilterCount>0?` (${activeFilterCount})`:''}
          </button>
          {/* Manage Stages — admin only */}
          {canManage && (
            <button onClick={()=>setShowStagesMgr(true)} className="makan-btn-tool" style={{ background:'rgba(255,255,255,0.8)', border:'1.5px solid rgba(226,232,240,0.8)', borderRadius:10, padding:'7px 13px', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#64748b' }}>
              <Settings size={12}/>{f('المراحل','Stages')}
            </button>
          )}
          {/* Add */}
          <button onClick={()=>setShowAdd(true)} style={{ background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:`0 4px 14px ${roleStyle.accent}44` }}>
            <Plus size={14}/>{f('إضافة طلب','Add Request')}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div style={{ ...GLASS, borderRadius:14, padding:'12px 16px', marginBottom:'1rem', display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div><div style={{ fontSize:10,fontWeight:700,color:'#94a3b8',marginBottom:4 }}>{f('المرحلة','Stage')}</div>
            <select value={filters.stage} onChange={e=>setFilters({...filters,stage:e.target.value})} style={{...fSelect,minWidth:130}}>
              <option value="all">{f('كل المراحل','All Stages')}</option>
              {salesStages.map(s=><option key={s.id} value={s.id}>{lang==='ar'?s.ar:s.en}</option>)}
            </select>
          </div>
          <div><div style={{ fontSize:10,fontWeight:700,color:'#94a3b8',marginBottom:4 }}>{f('الإيجنت','Agent')}</div>
            <select value={filters.agentId} onChange={e=>setFilters({...filters,agentId:e.target.value})} style={{...fSelect,minWidth:130}}>
              <option value="all">{f('كل الإيجنتس','All Agents')}</option>
              {users.filter(u=>u.role!=='admin').map(u=><option key={u.agentId} value={u.agentId}>{lang==='ar'?u.name:u.nameEn}</option>)}
            </select>
          </div>
          <div><div style={{ fontSize:10,fontWeight:700,color:'#94a3b8',marginBottom:4 }}>{f('من تاريخ','Date From')}</div>
            <input type="date" value={filters.dateFrom} onChange={e=>setFilters({...filters,dateFrom:e.target.value})} style={{...fInput,minWidth:130}}/>
          </div>
          <div><div style={{ fontSize:10,fontWeight:700,color:'#94a3b8',marginBottom:4 }}>{f('إلى تاريخ','Date To')}</div>
            <input type="date" value={filters.dateTo} onChange={e=>setFilters({...filters,dateTo:e.target.value})} style={{...fInput,minWidth:130}}/>
          </div>
          <button onClick={()=>setFilters({stage:'all',agentId:'all',dateFrom:'',dateTo:''})} style={{ padding:'8px 14px',borderRadius:10,background:'#fff2f2',border:'1.5px solid #fecaca',color:'#dc2626',fontSize:11,fontWeight:700,cursor:'pointer' }}>
            {f('مسح','Clear')}
          </button>
        </div>
      )}

      {/* Stage stats pills */}
      <div style={{ display:'flex', gap:7, marginBottom:'1rem', overflowX:'auto', paddingBottom:4 }}>
        {salesStages.map(s=>(
          <div key={s.id} className={`makan-stage-pill${filters.stage===s.id?' makan-stage-pill--active':''}`}
            onClick={()=>setFilters(p=>({...p,stage:p.stage===s.id?'all':s.id}))}
            style={{ background:'#fff', borderRadius:10, padding:'6px 12px', display:'flex', alignItems:'center', gap:7, flexShrink:0, border:`1.5px solid ${filters.stage===s.id?s.color:s.border}`, cursor:'pointer', transition:'all .12s', boxShadow:filters.stage===s.id?`0 0 0 2px ${s.color}44`:undefined, '--s-color':s.color }}>
            <div style={{ width:8,height:8,borderRadius:'50%',background:s.color }}/>
            <div style={{ fontSize:14,fontWeight:900,color:'#0f172a' }}>{stageLeads(s.id).length}</div>
            <div style={{ fontSize:10,color:'#64748b',fontWeight:700,whiteSpace:'nowrap' }}>{lang==='ar'?s.ar:s.en}</div>
          </div>
        ))}
      </div>

      {/* ── KANBAN VIEW ── */}
      {view==='kanban' && (
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:16, alignItems:'flex-start' }}>
          {salesStages.map(stage => {
            const colItems = stageLeads(stage.id);
            const isDO = dragOver === stage.id;
            return (
              <div key={stage.id}
                onDragOver={e=>{ if(!canManage)return; e.preventDefault(); setDragOver(stage.id); }}
                onDrop={e=>{ e.preventDefault(); if(canManage&&dragId) onUpdate(dragId,{stage:stage.id,updatedAt:new Date().toISOString()}); setDragId(null); setDragOver(null); }}
                onDragLeave={()=>setDragOver(null)}
                className="makan-kanban-col"
                style={{ flex:'0 0 200px', minWidth:200, display:'flex', flexDirection:'column', gap:8, background:isDO?`${stage.color}12`:'rgba(248,250,252,0.7)', borderRadius:16, padding:'10px', border:`2px solid ${isDO?stage.color:stage.border}`, transition:'all .18s', minHeight:350, backdropFilter:'blur(12px)', '--stage-color':stage.color }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'2px 2px 6px', borderBottom:`1.5px solid ${stage.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:9,height:9,borderRadius:'50%',background:stage.color }}/>
                    <div className="makan-kanban-stage-name" style={{ fontSize:11,fontWeight:800,color:'#0f172a' }}>{lang==='ar'?stage.ar:stage.en}</div>
                  </div>
                  <div style={{ background:stage.color,color:'#fff',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900 }}>{colItems.length}</div>
                </div>
                {colItems.map(req => (
                  <div key={req.id} className="makan-kanban-card" draggable={canManage} onDragStart={e=>{if(!canManage)return;setDragId(req.id);e.dataTransfer.effectAllowed='move';}} onDragEnd={()=>{setDragId(null);setDragOver(null);}}
                    onClick={()=>setSelected(req)}
                    style={{ background:'#fff', borderRadius:11, padding:'10px 12px', cursor:canManage?'grab':'pointer', border:'1.5px solid rgba(226,232,240,0.8)', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', opacity:dragId===req.id?.4:1, transition:'all .15s' }}>
                    <div className="makan-kanban-client" style={{ fontSize:12,fontWeight:800,color:'#0f172a',marginBottom:4 }}>{req.clientName}</div>
                    {req.phone && <div style={{ fontSize:10,color:'#64748b',display:'flex',alignItems:'center',gap:4,marginBottom:3 }}><Phone size={9}/>{req.phone}</div>}
                    <div style={{ fontSize:10,color:'#64748b',marginBottom:3 }}>🛏 {req.beds} · {req.location==='all'?f('أي موقع','Any Location'):req.location}</div>
                    {req.budget>0 && <div style={{ fontSize:11,fontWeight:700,color:roleStyle.accent }}>{Number(req.budget).toLocaleString()} AED</div>}
                    {req.agentName && <div style={{ fontSize:9,color:'#94a3b8',marginTop:5,paddingTop:4,borderTop:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:3 }}><User size={9}/>{req.agentName}</div>}
                  </div>
                ))}
                {canManage && (
                  <button onClick={()=>{setForm({...emptyForm,stage:stage.id});setShowAdd(true);}} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'7px',borderRadius:10,border:`1.5px dashed ${stage.border}`,background:'transparent',color:'#94a3b8',fontSize:11,fontWeight:700,cursor:'pointer',marginTop:'auto' }}>
                    <Plus size={12}/>{f('إضافة','Add')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── REPORT VIEW ── */}
      {view==='report' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* KPIs */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {[
              { label:f('إجمالي الطلبات','Total Requests'), value:totalReqs, color:PRIMARY, large:true },
              { label:f('إجمالي الميزانية','Total Budget'), value:totalBudget.toLocaleString()+' AED', color:'#16a34a' },
              { label:f('طلبات مغلقة','Closed'), value:filtered.filter(r=>r.stage==='closed').length, color:'#f97316', large:true },
            ].map(kpi=>(
              <div key={kpi.label} style={{ ...GLASS, borderRadius:16, padding:'1.2rem 1.5rem', flex:'1 1 140px', borderTop:`3px solid ${kpi.color}` }}>
                <div style={{ fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:6 }}>{kpi.label}</div>
                <div style={{ fontSize:kpi.large?28:20,fontWeight:900,color:kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
          {/* Stage breakdown */}
          <div style={{ ...GLASS, borderRadius:16, padding:'1.25rem' }}>
            <div style={{ fontSize:14,fontWeight:800,color:'#0f172a',marginBottom:14 }}>{f('توزيع المراحل','Stage Distribution')}</div>
            <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
              {byStage.filter(s=>s.count>0).map(s=>(
                <div key={s.id} style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ width:10,height:10,borderRadius:'50%',background:s.color,flexShrink:0 }}/>
                  <div style={{ flex:1,fontSize:12,fontWeight:700 }}>{lang==='ar'?s.ar:s.en}</div>
                  <div style={{ fontSize:12,fontWeight:900,color:s.color,minWidth:24 }}>{s.count}</div>
                  <div style={{ width:110 }}>
                    <div style={{ height:6,borderRadius:3,background:'#f1f5f9',overflow:'hidden' }}>
                      <div style={{ height:'100%',width:`${totalReqs?(s.count/totalReqs*100):0}%`,background:s.color,borderRadius:3,transition:'width .4s' }}/>
                    </div>
                  </div>
                  <div style={{ fontSize:10,color:'#94a3b8',minWidth:32,textAlign:'right' }}>{totalReqs?(s.count/totalReqs*100).toFixed(0):0}%</div>
                </div>
              ))}
              {byStage.every(s=>s.count===0) && <div style={{ color:'#94a3b8',fontSize:13,textAlign:'center',padding:'1rem' }}>{f('لا توجد بيانات','No data')}</div>}
            </div>
          </div>
          {/* Agent perf */}
          {byAgent.length>0 && (
            <div style={{ ...GLASS, borderRadius:16, padding:'1.25rem' }}>
              <div style={{ fontSize:14,fontWeight:800,color:'#0f172a',marginBottom:14 }}>{f('أداء الإيجنت','Agent Performance')}</div>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {byAgent.sort((a,b)=>b.count-a.count).map(u=>(
                  <div key={u.agentId} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:10,background:'#f8fafc' }}>
                    <div style={{ width:30,height:30,borderRadius:'50%',background:`${PRIMARY}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:PRIMARY }}>{u.avatar}</div>
                    <div style={{ flex:1,fontSize:13,fontWeight:700 }}>{lang==='ar'?u.name:u.nameEn}</div>
                    <div style={{ fontSize:13,fontWeight:900,color:PRIMARY }}>{u.count} {f('طلب','req')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Requests list */}
          <div style={{ ...GLASS, borderRadius:16, padding:'1.25rem' }}>
            <div style={{ fontSize:14,fontWeight:800,color:'#0f172a',marginBottom:14 }}>{f('قائمة الطلبات','Requests List')}</div>
            {filtered.length===0
              ? <div style={{ textAlign:'center',color:'#94a3b8',padding:'2rem',fontSize:13 }}>{f('لا توجد طلبات','No requests found')}</div>
              : <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  {filtered.map(req=>{
                    const stg = salesStages.find(s=>s.id===req.stage);
                    return (
                      <div key={req.id} onClick={()=>setSelected(req)} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:11,background:'#fff',border:'1.5px solid rgba(226,232,240,0.8)',cursor:'pointer',transition:'all .12s' }}>
                        <div style={{ width:8,height:8,borderRadius:'50%',background:stg?.color||'#ccc',flexShrink:0 }}/>
                        <div style={{ flex:1,fontSize:13,fontWeight:700 }}>{req.clientName}</div>
                        {req.phone && <div style={{ fontSize:11,color:'#64748b' }}>{req.phone}</div>}
                        {req.budget>0 && <div style={{ fontSize:12,fontWeight:800,color:PRIMARY }}>{Number(req.budget).toLocaleString()} AED</div>}
                        <div style={{ fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:20,background:stg?`${stg.color}14`:'#f1f5f9',color:stg?.color||'#64748b',border:`1px solid ${stg?.border||'#e2e8f0'}`,whiteSpace:'nowrap' }}>{lang==='ar'?stg?.ar:stg?.en}</div>
                        {req.agentName && <div style={{ fontSize:10,color:'#94a3b8' }}>{req.agentName}</div>}
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── STAGE MANAGER MODAL ── */}
      {showStagesMgr && (
        <div onClick={()=>setShowStagesMgr(false)} style={{ position:'fixed',inset:0,background:'rgba(10,14,30,0.75)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} className="makan-modal" style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:460,padding:'1.75rem',boxShadow:'0 24px 80px rgba(10,14,30,0.35)',fontFamily:"'Tajawal','Segoe UI',sans-serif",maxHeight:'80vh',overflowY:'auto' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem' }}>
              <h3 style={{ fontSize:17,fontWeight:900,color:'#0f172a',display:'flex',alignItems:'center',gap:8 }}>
                <Settings size={17} color={roleStyle.accent}/>{f('إدارة مراحل المبيعات','Manage Sales Stages')}
              </h3>
              <button onClick={()=>setShowStagesMgr(false)} style={{ background:'#f1f5f9',border:'none',borderRadius:8,padding:'6px',cursor:'pointer',color:'#64748b' }}><X size={15}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {salesStages.map(stage=>(
                <div key={stage.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:12,background:'#f8fafc',border:`1.5px solid ${stage.border}` }}>
                  <div style={{ width:12,height:12,borderRadius:'50%',background:stage.color,flexShrink:0 }}/>
                  {editingStage===stage.id ? (
                    <input defaultValue={lang==='ar'?stage.ar:stage.en} autoFocus
                      style={{ ...fInput, flex:1, padding:'4px 8px', fontSize:12 }}
                      onBlur={e=>{
                        const val=e.target.value.trim();
                        if(val){ const updated=salesStages.map(s=>s.id===stage.id?{...s,[lang==='ar'?'ar':'en']:val}:s); onSaveStages(updated); }
                        setEditingStage(null);
                      }}
                      onKeyDown={e=>{if(e.key==='Enter')e.target.blur();if(e.key==='Escape')setEditingStage(null);}}
                    />
                  ) : (
                    <div style={{ flex:1,fontSize:12,fontWeight:700,color:'#0f172a',cursor:'text' }} onClick={()=>setEditingStage(stage.id)}>
                      {lang==='ar'?stage.ar:stage.en}
                    </div>
                  )}
                  <button onClick={()=>setEditingStage(editingStage===stage.id?null:stage.id)} style={{ background:'transparent',border:'none',cursor:'pointer',color:editingStage===stage.id?PRIMARY:'#94a3b8',padding:'3px' }}>
                    <Filter size={12}/>
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14,padding:'10px 14px',borderRadius:12,background:'#f0f9ff',border:'1px solid #bae6fd',fontSize:12,color:'#0284c7',display:'flex',alignItems:'center',gap:6 }}>
              <Filter size={12}/>{f('اضغط على اسم المرحلة لتعديله','Click a stage name to edit it')}
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <div onClick={()=>setSelected(null)} style={{ position:'fixed',inset:0,background:'rgba(10,14,30,0.75)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} className="makan-modal" style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:440,padding:'1.5rem',boxShadow:'0 24px 80px rgba(10,14,30,0.35)',fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem' }}>
              <h3 style={{ fontSize:17,fontWeight:900,color:'#0f172a' }}>{selected.clientName}</h3>
              <button onClick={()=>setSelected(null)} style={{ background:'#f1f5f9',border:'none',borderRadius:8,padding:'6px',cursor:'pointer',color:'#64748b' }}><X size={15}/></button>
            </div>
            {/* Stage change buttons — admin only */}
            {canManage && (
              <div style={{ display:'flex',flexWrap:'wrap',gap:7,marginBottom:14 }}>
                {salesStages.map(s=>(
                  <button key={s.id} onClick={()=>{onUpdate(selected.id,{stage:s.id,updatedAt:new Date().toISOString()});setSelected(p=>({...p,stage:s.id}));}} style={{ padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',border:`1.5px solid ${selected.stage===s.id?s.color:s.border}`,background:selected.stage===s.id?s.color:`${s.color}12`,color:selected.stage===s.id?'#fff':s.color }}>
                    {lang==='ar'?s.ar:s.en}
                  </button>
                ))}
              </div>
            )}
            {/* Current stage badge for non-admin */}
            {!canManage && (() => { const stg=salesStages.find(s=>s.id===selected.stage); return stg ? (
              <div style={{ marginBottom:14 }}>
                <span style={{ padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:700,background:stg.color,color:'#fff',display:'inline-flex',alignItems:'center',gap:5 }}>
                  {lang==='ar'?stg.ar:stg.en}
                </span>
              </div>
            ) : null; })()}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14 }}>
              {selected.phone && <div style={{ background:'#f8fafc',borderRadius:10,padding:'8px 12px' }}><div style={{ fontSize:10,color:'#aaa',fontWeight:700,marginBottom:3 }}>{f('الهاتف','Phone')}</div><div style={{ fontSize:13,fontWeight:700 }}>{selected.phone}</div></div>}
              {selected.budget>0 && <div style={{ background:'#f8fafc',borderRadius:10,padding:'8px 12px' }}><div style={{ fontSize:10,color:'#aaa',fontWeight:700,marginBottom:3 }}>{f('الميزانية','Budget')}</div><div style={{ fontSize:13,fontWeight:800,color:roleStyle.accent }}>{Number(selected.budget).toLocaleString()} AED</div></div>}
              <div style={{ background:'#f8fafc',borderRadius:10,padding:'8px 12px' }}><div style={{ fontSize:10,color:'#aaa',fontWeight:700,marginBottom:3 }}>{f('عدد الغرف','Beds')}</div><div style={{ fontSize:13,fontWeight:700 }}>{selected.beds} {f('غرف','beds')}</div></div>
              <div style={{ background:'#f8fafc',borderRadius:10,padding:'8px 12px' }}><div style={{ fontSize:10,color:'#aaa',fontWeight:700,marginBottom:3 }}>{f('الموقع','Location')}</div><div style={{ fontSize:12,fontWeight:700 }}>{selected.location==='all'?f('أي موقع','Any Location'):selected.location}</div></div>
            </div>
            {/* Assign agent — admin only */}
            {canManage && (
              <div>
                <label style={fLabel}>{f('تعيين لإيجنت','Assign Agent')}</label>
                <select value={selected.agentId||''} onChange={e=>{const a=users.find(u=>u.agentId===e.target.value);const upd={agentId:e.target.value,agentName:a?(lang==='ar'?a.name:a.nameEn):''};onUpdate(selected.id,upd);setSelected(p=>({...p,...upd}));}} style={fSelect}>
                  <option value="">{f('غير مسند','Unassigned')}</option>
                  {users.filter(u=>u.role!=='admin').map(a=><option key={a.agentId} value={a.agentId}>{lang==='ar'?a.name:a.nameEn} ({a.agentId})</option>)}
                </select>
              </div>
            )}
            {canManage && (
              <div style={{ display:'flex',justifyContent:'flex-end',marginTop:14,paddingTop:12,borderTop:'1px solid #f1f5f9' }}>
                <button onClick={()=>{onDelete(selected.id);setSelected(null);}} style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,background:'#fff2f2',border:'1.5px solid #fecaca',color:'#dc2626',fontSize:12,fontWeight:700,cursor:'pointer' }}>
                  <Trash2 size={13}/>{f('حذف الطلب','Delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADD MODAL ── */}
      {showAdd && (
        <div onClick={()=>setShowAdd(false)} style={{ position:'fixed',inset:0,background:'rgba(10,14,30,0.75)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} className="makan-modal" style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:500,padding:'1.75rem',boxShadow:'0 24px 80px rgba(10,14,30,0.35)',fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
            <h3 style={{ fontSize:17,fontWeight:800,color:'#0f172a',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:8 }}>
              <Plus size={17} color={roleStyle.accent}/>{f('إضافة طلب جديد','New Sales Request')}
            </h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('اسم العميل *','Client Name *')}</label>
                <input value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} style={fInput} placeholder={f('الاسم الكامل','Full Name')}/>
              </div>
              <div><label style={fLabel}>{f('الهاتف','Phone')}</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{...fInput,direction:'ltr'}} placeholder="+971..."/></div>
              <div>
                <label style={fLabel}>{f('الميزانية (AED)','Budget (AED)')}</label>
                <NumberInput value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} style={fInput} placeholder="1,000,000"/>
              </div>
              <div><label style={fLabel}>{f('عدد الغرف','Bedrooms')}</label><select value={form.beds} onChange={e=>setForm({...form,beds:Number(e.target.value)})} style={fSelect}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}+ {f('غرف','beds')}</option>)}</select></div>
              <div><label style={fLabel}>{f('نوع العقار','Type')}</label><select value={form.propType} onChange={e=>setForm({...form,propType:e.target.value})} style={fSelect}>{PROPERTY_TYPES.filter(t=>t.id!=='all').map(t=><option key={t.id} value={t.id}>{lang==='ar'?t.ar:t.en}</option>)}</select></div>
              <div><label style={fLabel}>{f('الموقع','Location')}</label><select value={form.location} onChange={e=>setForm({...form,location:e.target.value})} style={fSelect}>{LOCATIONS.map(l=><option key={l.id} value={l.id}>{lang==='ar'?l.ar:l.en}</option>)}</select></div>
              <div style={{ gridColumn:'1/-1' }}><label style={fLabel}>{f('تعيين لإيجنت','Assign Agent')}</label><select value={form.agentId} onChange={e=>setForm({...form,agentId:e.target.value})} style={fSelect}><option value="">{f('غير مسند','Unassigned')}</option>{users.filter(u=>u.role!=='admin').map(a=><option key={a.agentId} value={a.agentId}>{lang==='ar'?a.name:a.nameEn} ({a.agentId})</option>)}</select></div>
              <div style={{ gridColumn:'1/-1' }}><label style={fLabel}>{f('المرحلة','Stage')}</label><select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})} style={fSelect}>{salesStages.map(s=><option key={s.id} value={s.id}>{lang==='ar'?s.ar:s.en}</option>)}</select></div>
            </div>
            <div style={{ display:'flex',gap:10,marginTop:16 }}>
              <button onClick={handleAdd} disabled={!form.clientName} style={{ flex:1,background:form.clientName?`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`:'#e2e8f0',color:form.clientName?'#fff':'#94a3b8',border:'none',borderRadius:11,padding:'11px',fontSize:14,fontWeight:700,cursor:form.clientName?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                <Plus size={16}/>{f('إضافة الطلب','Add Request')}
              </button>
              <button onClick={()=>setShowAdd(false)} className="makan-btn-cancel" style={{ padding:'11px 20px',borderRadius:11,border:'1.5px solid #e0e3e9',background:'#fff',color:'#64748b',fontSize:14,fontWeight:700,cursor:'pointer' }}>{f('إلغاء','Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AUTOMATIONS VIEW — Visual Canvas ─────────────────────────────────────────
function AutomationsView({ lang, f, rtl, roleStyle, automations, onAdd, onUpdate, onDelete, users, leadsStages }) {
  const [showForm, setShowForm] = useState(false);
  const emptyRule = { name:'', enabled:true, trigger:{ type:'lead_in_stage', stage:leadsStages[0]?.id||'unassigned', hours:24 }, action:{ type:'move_stage', stage:leadsStages[1]?.id||'new', agentId:'' } };
  const [form, setForm] = useState(emptyRule);

  const handleAdd = () => {
    if (!form.name) return;
    onAdd({ ...form, id:'auto'+Date.now() });
    setForm(emptyRule); setShowForm(false);
  };

  const TRIGGER_LABELS = {
    lead_in_stage:  f('ليد في مرحلة لأكثر من','Lead in stage for more than'),
    lead_unassigned:f('ليد غير مسند لأكثر من','Lead unassigned for more than'),
    new_lead:       f('عند إضافة ليد جديد','When new lead added'),
  };
  const ACTION_LABELS = {
    assign_agent: f('تعيين لإيجنت','Assign to Agent'),
    move_stage:   f('نقل لمرحلة','Move to Stage'),
    notify:       f('تنبيه المدير','Notify Manager'),
  };

  const getTriggerDetail = (rule) => {
    if (!rule.trigger) return '';
    const stageObj = leadsStages.find(s=>s.id===rule.trigger.stage);
    const stageName = stageObj ? (lang==='ar'?stageObj.ar:stageObj.en) : (rule.trigger.stage||'');
    if (rule.trigger.type==='lead_in_stage')  return `${stageName}  ›  ${rule.trigger.hours||24}h`;
    if (rule.trigger.type==='lead_unassigned') return `› ${rule.trigger.hours||24}h`;
    return '';
  };

  const getActionDetail = (rule) => {
    if (!rule.action) return '';
    if (rule.action.type==='assign_agent') {
      const ag = users.find(u=>u.agentId===rule.action.agentId);
      return ag ? (lang==='ar'?ag.name:ag.nameEn) : '';
    }
    if (rule.action.type==='move_stage') {
      const s = leadsStages.find(s=>s.id===rule.action.stage);
      return s ? (lang==='ar'?s.ar:s.en) : '';
    }
    return '';
  };

  return (
    <div dir={rtl?'rtl':'ltr'}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:10 }}>
            <Zap size={22} color={roleStyle.accent}/>{f('الأتمتة','Automations')}
          </h1>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>{f('قواعد تلقائية تعمل في الخلفية كل 5 دقائق','Background rules run every 5 minutes')}</p>
        </div>
        <button onClick={()=>{setForm(emptyRule);setShowForm(true);}} style={{ background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:`0 4px 14px ${roleStyle.accent}44` }}>
          <Plus size={14}/>{f('إضافة قاعدة','Add Rule')}
        </button>
      </div>

      {/* ── CANVAS ── */}
      <div className="makan-auto-canvas" style={{
        background:'linear-gradient(135deg,#f8faff 0%,#eef2ff 100%)',
        borderRadius:22,
        border:'1.5px solid rgba(99,102,241,0.13)',
        minHeight:450,
        padding:'1.75rem',
        overflow:'auto',
        position:'relative',
        boxShadow:'inset 0 2px 8px rgba(99,102,241,0.04)',
      }}>
        {automations.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:360, gap:18, color:'#94a3b8' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(99,102,241,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <GitBranch size={38} style={{ opacity:.3 }}/>
            </div>
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:16, fontWeight:700, margin:'0 0 8px', color:'#64748b' }}>{f('لا توجد قواعد أتمتة بعد','No automation rules yet')}</p>
              <p style={{ fontSize:13, margin:0, color:'#94a3b8', maxWidth:280 }}>{f('أضف قواعد لأتمتة عمليات الليدات تلقائياً','Add rules to automatically handle lead operations')}</p>
            </div>
            <button onClick={()=>{setForm(emptyRule);setShowForm(true);}} style={{ background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'11px 24px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:`0 4px 14px ${roleStyle.accent}44` }}>
              <Plus size={15}/>{f('إضافة أول قاعدة','Add First Rule')}
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14, minWidth:560 }}>
            {automations.map(rule => (
              <div key={rule.id} style={{
                background:'#fff',
                borderRadius:18,
                border:`1.5px solid ${rule.enabled?'rgba(99,102,241,0.18)':'rgba(226,232,240,0.9)'}`,
                boxShadow:`0 2px 12px rgba(99,102,241,${rule.enabled?.07:.03})`,
                overflow:'hidden',
                opacity:rule.enabled?1:.72,
                transition:'all .2s',
              }}>
                {/* Rule header bar */}
                <div style={{ display:'flex', alignItems:'center', padding:'11px 16px', borderBottom:'1px solid #f1f5f9', background:rule.enabled?'rgba(99,102,241,0.025)':'rgba(248,250,252,0.6)' }}>
                  <div style={{ width:8,height:8,borderRadius:'50%',background:rule.enabled?'#10b981':'#94a3b8',marginRight:10,flexShrink:0,boxShadow:rule.enabled?'0 0 6px #10b981aa':undefined }}/>
                  <div style={{ flex:1, fontSize:14, fontWeight:800, color:'#0f172a' }}>{rule.name}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>onUpdate(rule.id,{enabled:!rule.enabled})} style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:8,border:`1.5px solid ${rule.enabled?'#10b981':'#e2e8f0'}`,background:rule.enabled?'#f0fdf4':'#f8fafc',color:rule.enabled?'#10b981':'#64748b',fontSize:11,fontWeight:700,cursor:'pointer' }}>
                      {rule.enabled?<><Pause size={11}/>{f('إيقاف','Pause')}</>:<><Play size={11}/>{f('تشغيل','Enable')}</>}
                    </button>
                    <button onClick={()=>{if(window.confirm(f(`حذف "${rule.name}"؟`,`Delete "${rule.name}"?`)))onDelete(rule.id);}} style={{ padding:'5px 8px',borderRadius:8,background:'#fff2f2',border:'1.5px solid #fecaca',color:'#dc2626',cursor:'pointer',display:'flex',alignItems:'center' }}><Trash2 size={12}/></button>
                  </div>
                </div>

                {/* Flow diagram row */}
                <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:0, overflowX:'auto' }}>
                  {/* IF Node */}
                  <div style={{
                    flex:'1 1 180px', minWidth:160, maxWidth:260,
                    background:rule.enabled?'linear-gradient(135deg,#eff6ff,#dbeafe)':'#f8fafc',
                    border:`1.5px solid ${rule.enabled?'#bfdbfe':'#e2e8f0'}`,
                    borderRadius:14, padding:'14px 16px',
                  }}>
                    <div style={{ fontSize:9, fontWeight:900, color:rule.enabled?'#1d4ed8':'#94a3b8', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                      <Zap size={10}/> IF
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#0f172a', lineHeight:1.45, marginBottom:getTriggerDetail(rule)?6:0 }}>
                      {TRIGGER_LABELS[rule.trigger?.type]||rule.trigger?.type}
                    </div>
                    {getTriggerDetail(rule) && (
                      <div style={{ fontSize:11, color:'#3b82f6', fontWeight:600, background:'rgba(59,130,246,0.09)', borderRadius:6, padding:'3px 8px', display:'inline-block', marginTop:2 }}>
                        {getTriggerDetail(rule)}
                      </div>
                    )}
                  </div>

                  {/* Arrow connector */}
                  <div style={{ display:'flex', alignItems:'center', padding:'0 10px', flexShrink:0 }}>
                    <div style={{ width:36, height:2.5, background:rule.enabled?'linear-gradient(90deg,#a5b4fc,#6366f1)':'#e2e8f0', borderRadius:2 }}/>
                    <div style={{ width:0, height:0, borderTop:'7px solid transparent', borderBottom:'7px solid transparent', borderLeft:`11px solid ${rule.enabled?'#6366f1':'#e2e8f0'}` }}/>
                  </div>

                  {/* THEN Node */}
                  <div style={{
                    flex:'1 1 180px', minWidth:160, maxWidth:260,
                    background:rule.enabled?'linear-gradient(135deg,#f0fdf4,#dcfce7)':'#f8fafc',
                    border:`1.5px solid ${rule.enabled?'#bbf7d0':'#e2e8f0'}`,
                    borderRadius:14, padding:'14px 16px',
                  }}>
                    <div style={{ fontSize:9, fontWeight:900, color:rule.enabled?'#15803d':'#94a3b8', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                      <ArrowRight size={10}/> THEN
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#0f172a', lineHeight:1.45, marginBottom:getActionDetail(rule)?6:0 }}>
                      {ACTION_LABELS[rule.action?.type]||rule.action?.type}
                    </div>
                    {getActionDetail(rule) && (
                      <div style={{ fontSize:11, color:'#16a34a', fontWeight:600, background:'rgba(22,163,74,0.09)', borderRadius:6, padding:'3px 8px', display:'inline-block', marginTop:2 }}>
                        {getActionDetail(rule)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add another rule CTA */}
            <button onClick={()=>{setForm(emptyRule);setShowForm(true);}} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px',borderRadius:16,border:'2px dashed rgba(99,102,241,0.22)',background:'rgba(99,102,241,0.025)',color:'#6366f1',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .15s' }}>
              <Plus size={15}/>{f('إضافة قاعدة جديدة','Add New Rule')}
            </button>
          </div>
        )}
      </div>

      {/* ── ADD RULE MODAL ── */}
      {showForm && (
        <div onClick={()=>setShowForm(false)} style={{ position:'fixed',inset:0,background:'rgba(10,14,30,0.75)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} className="makan-modal" style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:520,padding:'1.75rem',boxShadow:'0 24px 80px rgba(10,14,30,0.35)' }}>
            <h3 style={{ fontSize:17,fontWeight:800,color:'#0f172a',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:8 }}>
              <Zap size={17} color={roleStyle.accent}/>{f('إضافة قاعدة أتمتة','Add Automation Rule')}
            </h3>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div><label style={fLabel}>{f('اسم القاعدة','Rule Name')}</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={fInput} placeholder={f('مثال: نقل الليدات الخاملة','e.g. Move idle leads')}/></div>

              {/* IF */}
              <div style={{ background:'linear-gradient(135deg,#eff6ff,#f0f9ff)',borderRadius:14,padding:'14px 16px',border:'1.5px solid #bae6fd' }}>
                <div style={{ fontSize:11,fontWeight:900,color:'#1d4ed8',marginBottom:12,display:'flex',alignItems:'center',gap:6 }}><Zap size={12}/>IF — {f('الشرط','Condition')}</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                  <div><label style={fLabel}>{f('المشغّل','Trigger')}</label>
                    <select value={form.trigger.type} onChange={e=>setForm({...form,trigger:{...form.trigger,type:e.target.value}})} style={fSelect}>
                      {AUTO_TRIGGERS.map(t=><option key={t.id} value={t.id}>{lang==='ar'?t.ar:t.en}</option>)}
                    </select>
                  </div>
                  {form.trigger.type==='lead_in_stage' && <div><label style={fLabel}>{f('المرحلة','Stage')}</label><select value={form.trigger.stage} onChange={e=>setForm({...form,trigger:{...form.trigger,stage:e.target.value}})} style={fSelect}>{leadsStages.map(s=><option key={s.id} value={s.id}>{lang==='ar'?s.ar:s.en}</option>)}</select></div>}
                  {form.trigger.type!=='new_lead' && <div><label style={fLabel}>{f('المدة (ساعات)','Duration (hours)')}</label><input type="number" min={1} value={form.trigger.hours||24} onChange={e=>setForm({...form,trigger:{...form.trigger,hours:Number(e.target.value)}})} style={fInput}/></div>}
                </div>
              </div>

              {/* THEN */}
              <div style={{ background:'linear-gradient(135deg,#f0fdf4,#f0faf4)',borderRadius:14,padding:'14px 16px',border:'1.5px solid #bbf7d0' }}>
                <div style={{ fontSize:11,fontWeight:900,color:'#15803d',marginBottom:12,display:'flex',alignItems:'center',gap:6 }}><ArrowRight size={12}/>THEN — {f('الإجراء','Action')}</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                  <div><label style={fLabel}>{f('الإجراء','Action')}</label><select value={form.action.type} onChange={e=>setForm({...form,action:{...form.action,type:e.target.value}})} style={fSelect}>{AUTO_ACTIONS.map(a=><option key={a.id} value={a.id}>{lang==='ar'?a.ar:a.en}</option>)}</select></div>
                  {form.action.type==='assign_agent' && <div><label style={fLabel}>{f('الإيجنت','Agent')}</label><select value={form.action.agentId||''} onChange={e=>setForm({...form,action:{...form.action,agentId:e.target.value}})} style={fSelect}><option value="">{f('اختر','Select')}</option>{users.filter(u=>u.role!=='admin').map(a=><option key={a.agentId} value={a.agentId}>{lang==='ar'?a.name:a.nameEn}</option>)}</select></div>}
                  {form.action.type==='move_stage' && <div><label style={fLabel}>{f('المرحلة','Stage')}</label><select value={form.action.stage||''} onChange={e=>setForm({...form,action:{...form.action,stage:e.target.value}})} style={fSelect}>{leadsStages.map(s=><option key={s.id} value={s.id}>{lang==='ar'?s.ar:s.en}</option>)}</select></div>}
                </div>
              </div>
            </div>
            <div style={{ display:'flex',gap:10,marginTop:16 }}>
              <button onClick={handleAdd} disabled={!form.name} style={{ flex:1,background:form.name?`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`:'#e2e8f0',color:form.name?'#fff':'#94a3b8',border:'none',borderRadius:11,padding:'11px',fontSize:14,fontWeight:700,cursor:form.name?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                <Zap size={16}/>{f('إضافة القاعدة','Add Rule')}
              </button>
              <button onClick={()=>setShowForm(false)} style={{ padding:'11px 20px',borderRadius:11,border:'1.5px solid #e0e3e9',background:'#fff',color:'#64748b',fontSize:14,fontWeight:700,cursor:'pointer' }}>{f('إلغاء','Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI ASSISTANT VIEW ────────────────────────────────────────────────────────
function AIAssistantView({ lang, f, rtl, roleStyle, allProperties, leads, users, currentUser, leadsStages }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // ── LOCAL AI ENGINE — No API needed ──────────────────────────────────────────
  const localAI = (message) => {
    const msg = message.toLowerCase().trim();
    const ar  = lang === 'ar';
    const ts  = () => new Date().toLocaleTimeString(ar?'ar-AE':'en-AE',{hour:'2-digit',minute:'2-digit'});

    const totalProps  = allProperties.length;
    const available   = allProperties.filter(p=>!p.reservedBy).length;
    const reserved    = totalProps - available;
    const totalVal    = allProperties.reduce((s,p)=>s+Number(p.price||0),0);
    const totalLeads  = leads.length;
    const unassigned  = leads.filter(l=>!l.agentId).length;
    const stages      = (leadsStages||LEADS_STAGES);
    const stageMap    = stages.reduce((a,s)=>{ a[s.id]=leads.filter(l=>l.stage===s.id).length; return a; },{});
    const topStage    = stages.reduce((a,s)=>stageMap[s.id]>(stageMap[a?.id]||0)?s:a, stages[0]);
    const agentStats  = users.filter(u=>u.role!=='admin').map(u=>({ ...u, lc:leads.filter(l=>l.agentId===u.agentId).length, pc:allProperties.filter(p=>p.agentId===u.agentId).length })).sort((a,b)=>b.lc-a.lc);
    const topAgent    = agentStats[0];
    const byType      = PROPERTY_TYPES.filter(t=>t.id!=='all').map(t=>({t, count:allProperties.filter(p=>p.type===t.id).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
    const byLoc       = LOCATIONS.filter(l=>l.id!=='all').map(l=>({l, count:allProperties.filter(p=>p.location===l.id).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count).slice(0,5);

    const has = (...kws) => kws.some(k => msg.includes(k));

    // ── Summary / Overview ────────────────────────────────────────────────────
    if (has('ملخص','نظرة','كل','summary','overview','report','تقرير')) {
      return ar ?
`📊 **ملخص شامل — MAKAN**

🏠 **العقارات**
• الإجمالي: **${totalProps} وحدة** | متاح: ${available} | محجوز: ${reserved}
• القيمة: **${(totalVal/1e6).toFixed(2)}M AED**

📋 **الليدات**
• الإجمالي: **${totalLeads}** | غير مسندة: **${unassigned}** (${totalLeads?Math.round(unassigned/totalLeads*100):0}%)
• أكثر مرحلة: **${ar?topStage?.ar:topStage?.en}** (${stageMap[topStage?.id]||0})

👥 **الفريق**
• ${users.length} مستخدم | ${users.filter(u=>u.role==='listing').length} ليستنج | ${users.filter(u=>u.role==='sales').length} مبيعات
• أكثر إيجنت نشاطاً: **${topAgent?topAgent.name:'—'}** (${topAgent?.lc||0} ليد)

💡 **توصية**: ${unassigned>0?`وزّع ${unassigned} ليد غير مسند على الفريق لزيادة الكفاءة.`:'كل الليدات مسندة. ممتاز! 🎉'}` :

`📊 **Full System Summary — MAKAN**

🏠 **Properties**
• Total: **${totalProps} units** | Available: ${available} | Reserved: ${reserved}
• Portfolio: **${(totalVal/1e6).toFixed(2)}M AED**

📋 **Leads**
• Total: **${totalLeads}** | Unassigned: **${unassigned}** (${totalLeads?Math.round(unassigned/totalLeads*100):0}%)
• Top stage: **${topStage?.en}** (${stageMap[topStage?.id]||0})

👥 **Team**
• ${users.length} users | ${users.filter(u=>u.role==='listing').length} listing | ${users.filter(u=>u.role==='sales').length} sales
• Top agent: **${topAgent?topAgent.nameEn||topAgent.name:'—'}** (${topAgent?.lc||0} leads)

💡 **Tip**: ${unassigned>0?`Distribute ${unassigned} unassigned leads to boost efficiency.`:'All leads are assigned. Excellent! 🎉'}`;
    }

    // ── Leads analysis ────────────────────────────────────────────────────────
    if (has('ليد','lead','عميل','client')) {
      if (has('غير مسند','unassigned')) {
        const list = leads.filter(l=>!l.agentId).slice(0,5);
        return ar ?
`⚠️ **الليدات غير المسندة: ${unassigned}**\n\n${list.map((l,i)=>`${i+1}. **${l.name}** — ${l.phone||'لا هاتف'} | المصدر: ${l.source||'يدوي'}`).join('\n')}${unassigned>5?`\n... و ${unassigned-5} ليد آخر`:''}\n\n💡 استخدم "توزيع الليدات" في صفحة الليدات.` :
`⚠️ **Unassigned Leads: ${unassigned}**\n\n${list.map((l,i)=>`${i+1}. **${l.name}** — ${l.phone||'No phone'} | Source: ${l.source||'manual'}`).join('\n')}${unassigned>5?`\n... and ${unassigned-5} more`:''}\n\n💡 Use "Distribute Leads" in the Leads section.`;
      }
      const stagesReport = stages.map(s=>`• ${ar?s.ar:s.en}: **${stageMap[s.id]||0}**`).join('\n');
      const srcMap = leads.reduce((a,l)=>{a[l.source||'manual']=(a[l.source||'manual']||0)+1;return a;},{});
      return ar ?
`📋 **تحليل الليدات**\n\nالإجمالي: **${totalLeads} ليد** | غير مسند: ${unassigned}\n\n**المراحل:**\n${stagesReport}\n\n**المصادر:**\n${Object.entries(srcMap).map(([k,v])=>`• ${k}: ${v}`).join('\n')}` :
`📋 **Leads Analysis**\n\nTotal: **${totalLeads}** | Unassigned: ${unassigned}\n\n**Stages:**\n${stagesReport}\n\n**Sources:**\n${Object.entries(srcMap).map(([k,v])=>`• ${k}: ${v}`).join('\n')}`;
    }

    // ── Properties ───────────────────────────────────────────────────────────
    if (has('وحدة','عقار','شقة','فيلا','unit','property','properties','available','متاح')) {
      return ar ?
`🏠 **تحليل الوحدات العقارية**\n\nالإجمالي: **${totalProps}** | متاح: **${available}** | محجوز: **${reserved}**\nالقيمة: **${(totalVal/1e6).toFixed(2)}M AED**\n\n**الأنواع:**\n${byType.map(({t,count})=>`• ${t.ar}: **${count}**`).join('\n')}\n\n**أكثر المواقع:**\n${byLoc.map(({l,count})=>`• ${l.ar}: **${count}**`).join('\n')}` :
`🏠 **Properties Analysis**\n\nTotal: **${totalProps}** | Available: **${available}** | Reserved: **${reserved}**\nValue: **${(totalVal/1e6).toFixed(2)}M AED**\n\n**Types:**\n${byType.map(({t,count})=>`• ${t.en}: **${count}**`).join('\n')}\n\n**Top Locations:**\n${byLoc.map(({l,count})=>`• ${l.en}: **${count}**`).join('\n')}`;
    }

    // ── Team ─────────────────────────────────────────────────────────────────
    if (has('فريق','إيجنت','team','agent','أداء','performance','أفضل','best','top')) {
      return ar ?
`👥 **تحليل الفريق**\n\nإجمالي: ${users.length} مستخدم\n\n**أداء الإيجنتس (بالليدات):**\n${agentStats.map((u,i)=>`${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1+'.'} **${u.name}** — ${u.lc} ليد | ${u.pc} وحدة`).join('\n')||'لا يوجد بيانات'}` :
`👥 **Team Analysis**\n\nTotal: ${users.length} users\n\n**Agent Performance (by leads):**\n${agentStats.map((u,i)=>`${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1+'.'} **${u.nameEn||u.name}** — ${u.lc} leads | ${u.pc} units`).join('\n')||'No data'}`;
    }

    // ── Default ───────────────────────────────────────────────────────────────
    return ar ?
`🤖 **مساعد MAKAN AI**\n\nيمكنني تحليل بيانات النظام. جرّب:\n• **"ملخص النظام"** — نظرة شاملة\n• **"تحليل الليدات"** — حالة الليدات\n• **"الليدات غير المسندة"** — من يحتاج تعيين\n• **"تحليل الوحدات"** — حالة العقارات\n• **"أداء الفريق"** — مقارنة الإيجنتس` :
`🤖 **MAKAN AI Assistant**\n\nI can analyze your system data. Try:\n• **"System summary"** — full overview\n• **"Leads analysis"** — pipeline status\n• **"Unassigned leads"** — who needs assignment\n• **"Properties analysis"** — inventory status\n• **"Team performance"** — agent comparison`;
  };

  const buildContext = () => {
    const available = allProperties.filter(p=>!p.reservedBy).length;
    const totalVal  = allProperties.reduce((s,p)=>s+Number(p.price||0),0);
    const byStage   = leads.reduce((a,l)=>{ a[l.stage]=(a[l.stage]||0)+1; return a; }, {});
    const unassigned= leads.filter(l=>!l.agentId).length;
    return `
📊 بيانات النظام الحالية:
- إجمالي الوحدات: ${allProperties.length} (متاحة: ${available}, محجوزة: ${allProperties.length-available})
- قيمة المحفظة: ${(totalVal/1e6).toFixed(1)} مليون AED
- إجمالي الليدات: ${leads.length} (غير مسندة: ${unassigned})
- توزيع الليدات بالمراحل: ${Object.entries(byStage).map(([s,c])=>`${s}:${c}`).join(', ')}
- فريق العمل: ${users.length} مستخدم
- المستخدم الحالي: ${currentUser.name} (${currentUser.role})`;
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const ts = new Date().toLocaleTimeString(lang==='ar'?'ar-AE':'en-AE',{hour:'2-digit',minute:'2-digit'});
    const userMsg = { role:'user', content:input, ts };
    setMessages(prev=>[...prev, userMsg]);
    const q = input; setInput(''); setLoading(true);
    setTimeout(() => {
      const reply = localAI(q);
      setMessages(prev=>[...prev, { role:'assistant', content:reply, ts: new Date().toLocaleTimeString(lang==='ar'?'ar-AE':'en-AE',{hour:'2-digit',minute:'2-digit'}) }]);
      setLoading(false);
    }, 400);
  };

  const SUGGESTIONS = lang==='ar'
    ? ['ملخص النظام', 'الليدات غير المسندة', 'أداء الفريق', 'تحليل الوحدات']
    : ['System summary', 'Unassigned leads', 'Team performance', 'Properties analysis'];

  return (
    <div dir={rtl?'rtl':'ltr'} style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 120px)', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:10 }}>
            <Bot size={22} color={roleStyle.accent}/>{f('مساعد MAKAN AI','MAKAN AI Assistant')}
          </h1>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>{f('يعمل بذكاء على بيانات نظامك — بدون إنترنت','Works intelligently on your system data — no internet needed')}</p>
        </div>
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'6px 12px', fontSize:11, fontWeight:700, color:'#16a34a', display:'flex', alignItems:'center', gap:5 }}>
          <CheckCircle2 size={13}/>{f('يعمل محلياً ✓','Works Locally ✓')}
        </div>
      </div>

      <div className="makan-ai-messages" style={{ flex:1, overflowY:'auto', background:'#fff', borderRadius:20, padding:'1.25rem', display:'flex', flexDirection:'column', gap:12, marginBottom:'1rem', border:'1px solid #e2e8f0', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'3rem 1rem', color:'#94a3b8' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:`${roleStyle.accent}15`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Bot size={36} color={roleStyle.accent} style={{ opacity:.7 }}/>
            </div>
            <p style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:6 }}>{f('كيف يمكنني مساعدتك؟','How can I help you?')}</p>
            <p style={{ fontSize:13, color:'#94a3b8', marginBottom:'1.5rem' }}>{f('اسألني وسأحلل بياناتك فوراً من النظام','Ask me and I\'ll analyze your system data instantly')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
              {SUGGESTIONS.map((s,i)=>(
                <button key={i} onClick={()=>setInput(s)} style={{ padding:'9px 18px', borderRadius:20, background:`${roleStyle.accent}0f`, border:`1.5px solid ${roleStyle.accent}30`, color:roleStyle.accent, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Tajawal','Segoe UI',sans-serif", transition:'all .15s' }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: msg.role==='user'?(rtl?'flex-start':'flex-end'):(rtl?'flex-end':'flex-start'), gap:4 }}>
            <div className={msg.role==='assistant'?'makan-ai-bubble':''} style={{ maxWidth:'82%', background: msg.role==='user'?roleStyle.accent:'#f8fafc', color:msg.role==='user'?'#fff':'#0f172a', borderRadius: msg.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px', padding:'12px 16px', fontSize:13, lineHeight:1.7, fontFamily:"'Tajawal','Segoe UI',sans-serif", boxShadow: msg.role==='user'?`0 3px 14px ${roleStyle.accent}44`:'0 2px 8px rgba(0,0,0,0.05)', border: msg.role==='assistant'?'1px solid #e2e8f0':undefined, whiteSpace:'pre-wrap' }}>
              {msg.content}
            </div>
            {msg.ts && <div style={{ fontSize:9, color:'#cbd5e1', padding:'0 4px' }}>{msg.ts}</div>}
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', alignItems: rtl?'flex-end':'flex-start' }}>
            <div className="makan-ai-bubble" style={{ background:'#f8fafc', borderRadius:'18px 18px 18px 4px', padding:'12px 16px', border:'1px solid #e2e8f0' }}>
              <div style={{ display:'flex', gap:5 }}>
                {[0,1,2].map(d=><div key={d} style={{ width:7, height:7, borderRadius:'50%', background:roleStyle.accent, animation:`bounce 1s ease-in-out ${d*0.15}s infinite alternate` }}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={msgEndRef}/>
      </div>

      <div className="makan-ai-input-bar" style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:18, padding:'10px 10px 10px 16px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()} placeholder={f('اكتب سؤالك هنا... (مثال: كم ليد غير مسند؟)','Type your question... (e.g. How many unassigned leads?)')}
          style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:14, fontFamily:"'Tajawal','Segoe UI',sans-serif", color:'#0f172a' }}/>
        <button onClick={sendMessage} disabled={!input.trim()} style={{ background:!input.trim()?'#e2e8f0':`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:!input.trim()?'#94a3b8':'#fff', border:'none', borderRadius:12, width:42, height:42, display:'flex', alignItems:'center', justifyContent:'center', cursor:!input.trim()?'not-allowed':'pointer', flexShrink:0, boxShadow:!input.trim()?'none':`0 4px 14px ${roleStyle.accent}44` }}>
          <Send size={18}/>
        </button>
      </div>
      <style>{`@keyframes bounce{from{transform:scale(1)}to{transform:scale(1.4)}}`}</style>
    </div>
  );
}

// ─── ORG CHART VIEW ──────────────────────────────────────────────────────────
function OrgChartView({ lang, f, rtl, roleStyle, orgNodes, onAddNode, onUpdateNode, onDeleteNode, users, orgPositions, onSavePositions }) {
  const NODE_W = 168, NODE_H = 86;
  const [selectedNode, setSelectedNode] = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [editingNode,  setEditingNode]  = useState(null);
  const emptyForm = { name:'', nameEn:'', role:'', roleEn:'', color:'#3b82f6', bg:'#dbeafe', type:'dept', avatar:'', employees:0, parentId:null };
  const [form, setForm] = useState(emptyForm);
  const [positions, setPositions] = useState({});
  const dragging = useRef(null);
  const canvasRef = useRef(null);

  // Calculate default tree positions level-by-level
  const calcDefaultPositions = (nodes) => {
    const pos = {};
    if (!nodes.length) return pos;
    const root = nodes.find(n => n.parentId === null);
    if (!root) return pos;
    const getChildren = (id) => nodes.filter(n => n.parentId === id);
    const HGAP = 200, VGAP = 140;
    const assignPos = (id, x, y) => {
      pos[id] = { x, y };
      const ch = getChildren(id);
      if (!ch.length) return;
      const totalW = ch.length * HGAP;
      let startX = x - totalW / 2 + HGAP / 2;
      ch.forEach(c => { assignPos(c.id, startX, y + VGAP); startX += HGAP; });
    };
    assignPos(root.id, 700, 60);
    return pos;
  };

  // Merge saved positions with defaults for any missing nodes
  useEffect(() => {
    const defaults = calcDefaultPositions(orgNodes);
    const merged = { ...defaults };
    Object.keys(orgPositions || {}).forEach(id => { merged[id] = orgPositions[id]; });
    setPositions(merged);
  }, [orgNodes.length]);

  const getPos = (id) => positions[id] || { x: 100, y: 100 };

  const genAvatar = (nameEn, name) => {
    const src = (nameEn || name || '').trim();
    const parts = src.split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : src.slice(0,3).toUpperCase();
  };

  const startAdd = (parentId) => { setEditingNode(null); setForm({ ...emptyForm, parentId }); setShowForm(true); };
  const startEdit = (node) => { setEditingNode(node); setForm({ ...node }); setShowForm(true); };

  const handleSubmit = () => {
    if (!form.name && !form.nameEn) return;
    const avatar = genAvatar(form.nameEn, form.name);
    if (editingNode) {
      onUpdateNode(editingNode.id, { ...form, avatar });
      setSelectedNode(prev => prev?.id === editingNode.id ? { ...prev, ...form, avatar } : prev);
    } else {
      onAddNode({ ...form, id:'org'+Date.now(), avatar });
    }
    setShowForm(false); setEditingNode(null);
  };

  const handleDelete = (node) => {
    if (orgNodes.some(n => n.parentId === node.id)) {
      alert(f('لا يمكن الحذف — يحتوي على عناصر فرعية. احذفها أولاً.','Cannot delete — node has children. Delete them first.'));
      return;
    }
    onDeleteNode(node.id);
    if (selectedNode?.id === node.id) setSelectedNode(null);
  };

  const handleMouseDown = (e, nodeId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    const origPos = getPos(nodeId);
    dragging.current = { nodeId, startX, startY, origX: origPos.x, origY: origPos.y };
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - dragging.current.startX;
    const dy = (e.clientY - rect.top) - dragging.current.startY;
    setPositions(prev => ({ ...prev, [dragging.current.nodeId]: { x: dragging.current.origX + dx, y: dragging.current.origY + dy } }));
  };

  const handleMouseUp = () => {
    if (dragging.current) {
      const newPos = { ...(orgPositions || {}), ...positions };
      onSavePositions(newPos);
    }
    dragging.current = null;
  };

  const resetLayout = () => {
    const defaults = calcDefaultPositions(orgNodes);
    setPositions(defaults);
    onSavePositions(defaults);
  };

  // Compute canvas bounding box
  const canvasW = Math.max(1400, ...orgNodes.map(n => (getPos(n.id).x || 0) + NODE_W + 60));
  const canvasH = Math.max(900,  ...orgNodes.map(n => (getPos(n.id).y || 0) + NODE_H + 60));

  const selectedChildren = selectedNode ? orgNodes.filter(n => n.parentId === selectedNode.id) : [];
  const root = orgNodes.find(n => n.parentId === null);

  return (
    <div dir={rtl?'rtl':'ltr'}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:10 }}>
            <Network size={22} color={roleStyle.accent}/>{f('هيكل الشركة','Company Structure')}
          </h1>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>{f('اسحب العناصر لإعادة ترتيبها','Drag nodes to rearrange')} · {orgNodes.length} {f('عنصر','nodes')}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={resetLayout} style={{ background:'#f1f5f9', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'8px 16px', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <RefreshCw size={13}/>{f('إعادة الترتيب','Reset Layout')}
          </button>
          <button onClick={() => startAdd(selectedNode?.id || root?.id || null)} style={{ background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:"'Tajawal','Segoe UI',sans-serif", boxShadow:`0 4px 14px ${roleStyle.accent}44` }}>
            <Plus size={15}/>{f('إضافة عنصر','Add Node')}
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
        {/* Canvas */}
        <div className="makan-orgchart-canvas" style={{ flex:1, minWidth:0, background:'#f8fafc', borderRadius:20, border:'1.5px solid #e2e8f0', overflow:'auto', position:'relative' }}>
          {orgNodes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem', color:'#94a3b8' }}>
              <Network size={48} style={{ opacity:.3, marginBottom:16 }}/>
              <p style={{ fontSize:15, fontWeight:700 }}>{f('لا يوجد هيكل بعد — أضف الجذر أولاً','No structure yet — add a root node first')}</p>
              <button onClick={() => startAdd(null)} style={{ marginTop:12, background:roleStyle.accent, color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {f('إضافة الرئيس التنفيذي','Add CEO Node')}
              </button>
            </div>
          ) : (
            <div
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ position:'relative', width:canvasW, height:canvasH, userSelect:'none' }}
            >
              {/* SVG lines */}
              <svg style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'visible' }} width={canvasW} height={canvasH}>
                {orgNodes.map(node => {
                  if (!node.parentId) return null;
                  const p = getPos(node.parentId);
                  const c = getPos(node.id);
                  const x1 = p.x + NODE_W / 2, y1 = p.y + NODE_H;
                  const x2 = c.x + NODE_W / 2, y2 = c.y;
                  const my = (y1 + y2) / 2;
                  return (
                    <path key={node.id} className="makan-orgchart-line" d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
                      stroke="#cbd5e1" strokeWidth={2} fill="none" strokeDasharray="0"/>
                  );
                })}
              </svg>

              {/* Node cards */}
              {orgNodes.map(node => {
                const pos = getPos(node.id);
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    className="makan-orgchart-node"
                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                    onClick={(e) => { if (Math.abs(e.movementX) < 3 && Math.abs(e.movementY) < 3) setSelectedNode(isSelected ? null : node); }}
                    style={{
                      position:'absolute', left:pos.x, top:pos.y,
                      width:NODE_W, height:NODE_H,
                      background: isSelected ? node.color : '#fff',
                      border:`2.5px solid ${node.color}`,
                      borderRadius:16, cursor:'grab',
                      boxShadow: isSelected ? `0 8px 28px ${node.color}55` : '0 4px 16px rgba(0,0,0,0.09)',
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      gap:3, padding:'10px 12px', transition:'box-shadow .2s',
                      overflow:'hidden',
                    }}
                  >
                    {node.type === 'ceo' && (
                      <div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)', background:node.color, borderRadius:'0 0 8px 8px', padding:'1px 10px', fontSize:9, fontWeight:800, color:'#fff', letterSpacing:.5 }}>CEO</div>
                    )}
                    <div style={{ fontSize:9, fontWeight:800, color: isSelected?'rgba(255,255,255,0.75)':node.color, letterSpacing:.5, textAlign:'center', textTransform:'uppercase', marginTop: node.type==='ceo'?8:0 }}>
                      {lang==='ar' ? node.role : node.roleEn}
                    </div>
                    <div style={{ fontSize:14, fontWeight:900, color: isSelected?'#fff':'#0f172a', textAlign:'center', lineHeight:1.2 }}>
                      {lang==='ar' ? node.name : node.nameEn}
                    </div>
                    {(node.memberIds||[]).length > 0 && (
                      <div style={{ fontSize:9, color: isSelected?'rgba(255,255,255,0.7)':'#94a3b8', display:'flex', alignItems:'center', gap:3 }}>
                        <Users size={8}/>{(node.memberIds||[]).length} {f('موظف','emp')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        {selectedNode && (
          <div style={{ width:264, flexShrink:0 }}>
            <div className="makan-orgchart-detail" style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:`0 8px 32px ${selectedNode.color}22`, border:'1.5px solid #e2e8f0', position:'sticky', top:80 }}>
              <div style={{ background:selectedNode.color, padding:'1.25rem', color:'#fff' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, opacity:.75, textTransform:'uppercase', letterSpacing:.8 }}>{lang==='ar'?selectedNode.role:selectedNode.roleEn}</div>
                  <button onClick={() => setSelectedNode(null)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:6, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}><X size={13}/></button>
                </div>
                <div style={{ fontSize:17, fontWeight:900 }}>{lang==='ar'?selectedNode.name:selectedNode.nameEn}</div>
                {(selectedNode.memberIds||[]).length > 0 && (
                  <div style={{ fontSize:12, opacity:.8, marginTop:5, display:'flex', alignItems:'center', gap:5 }}>
                    <Users size={12}/>{(selectedNode.memberIds||[]).length} {f('موظف','employees')}
                  </div>
                )}
              </div>
              <div style={{ padding:'1rem' }}>
                {selectedChildren.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.8, marginBottom:8 }}>{f('العناصر الفرعية','Sub-nodes')}</div>
                    {selectedChildren.map(child => (
                      <div key={child.id} onClick={() => setSelectedNode(child)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:10, background:child.bg||'#f8fafc', border:`1.5px solid ${child.color}44`, marginBottom:6, cursor:'pointer' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:child.color, flexShrink:0 }}/>
                        <div style={{ flex:1, fontSize:12, fontWeight:700, color:'#0f172a' }}>{lang==='ar'?child.name:child.nameEn}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Employee Assignment */}
                {(() => {
                  const memberIds = selectedNode.memberIds || [];
                  const members = users.filter(u => memberIds.includes(u.id));
                  const nonMembers = users.filter(u => !memberIds.includes(u.id));
                  return (
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:10, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.8, marginBottom:8 }}>{f('الموظفون','Members')} ({members.length})</div>
                      {members.map(u => (
                        <div key={u.id} style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 9px', borderRadius:9, background:'rgba(241,245,249,0.7)', marginBottom:5 }}>
                          <div style={{ width:26, height:26, borderRadius:'50%', background:selectedNode.color+'22', border:`1.5px solid ${selectedNode.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:selectedNode.color, flexShrink:0 }}>{u.avatar}</div>
                          <div style={{ flex:1, fontSize:11, fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lang==='ar'?u.name:u.nameEn}</div>
                          <button onClick={() => onUpdateNode(selectedNode.id, { memberIds: memberIds.filter(id=>id!==u.id), employees: Math.max(0,(selectedNode.employees||0)-1) })} style={{ background:'#fff2f2', border:'none', borderRadius:6, padding:'3px 6px', cursor:'pointer', color:'#dc2626', fontSize:10, fontWeight:700, flexShrink:0 }}>✕</button>
                        </div>
                      ))}
                      {nonMembers.length > 0 && (
                        <select onChange={e => {
                          if (!e.target.value) return;
                          onUpdateNode(selectedNode.id, { memberIds:[...memberIds, e.target.value], employees:(selectedNode.employees||0)+1 });
                          setSelectedNode(prev => ({...prev, memberIds:[...memberIds, e.target.value], employees:(prev.employees||0)+1}));
                          e.target.value='';
                        }} style={{ ...fSelect, marginTop:6, fontSize:12 }}>
                          <option value="">{f('+ إضافة موظف','+ Add Member')}</option>
                          {nonMembers.map(u => <option key={u.id} value={u.id}>{lang==='ar'?u.name:u.nameEn} — {u.agentId}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })()}
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  <button onClick={() => startEdit(selectedNode)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, background:roleStyle.light, border:`1.5px solid ${roleStyle.accent}44`, color:roleStyle.accent, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                    <Settings size={13}/>{f('تعديل','Edit')}
                  </button>
                  <button onClick={() => startAdd(selectedNode.id)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, background:'#f0fdf4', border:'1.5px solid #bbf7d0', color:'#16a34a', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                    <Plus size={13}/>{f('إضافة عنصر فرعي','Add Child')}
                  </button>
                  {selectedNode.type !== 'ceo' && (
                    <button onClick={() => handleDelete(selectedNode)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderRadius:9, background:'#fff2f2', border:'1.5px solid #fecaca', color:'#dc2626', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                      <Trash2 size={13}/>{f('حذف','Delete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div onClick={() => setShowForm(false)} style={{ position:'fixed', inset:0, background:'rgba(15,20,40,0.55)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div onClick={e => e.stopPropagation()} className="makan-modal" style={{ background:'#fff',backdropFilter:'none',WebkitBackdropFilter:'none',borderRadius:20,width:'100%',maxWidth:480, padding:'1.75rem', boxShadow:'0 24px 80px rgba(15,23,42,0.28), inset 0 1px 0 rgba(255,255,255,0.90)' }}>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:8 }}>
              {editingNode ? <Settings size={17} color={roleStyle.accent}/> : <Plus size={17} color={roleStyle.accent}/>}
              {editingNode ? f('تعديل العنصر','Edit Node') : f('إضافة عنصر جديد','Add New Node')}
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={fLabel}>{f('الاسم (عربي)','Arabic Name')}</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={fInput} placeholder={f('مثال: قسم المبيعات','e.g. Sales Dept')}/>
              </div>
              <div>
                <label style={fLabel}>{f('الاسم (إنجليزي)','English Name')}</label>
                <input value={form.nameEn} onChange={e=>setForm({...form,nameEn:e.target.value})} style={{...fInput,direction:'ltr'}} placeholder="e.g. Sales Dept"/>
              </div>
              <div>
                <label style={fLabel}>{f('المنصب (عربي)','Arabic Role')}</label>
                <input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={fInput}/>
              </div>
              <div>
                <label style={fLabel}>{f('المنصب (إنجليزي)','English Role')}</label>
                <input value={form.roleEn} onChange={e=>setForm({...form,roleEn:e.target.value})} style={{...fInput,direction:'ltr'}}/>
              </div>
              <div>
                <label style={fLabel}>{f('النوع','Type')}</label>
                <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={fSelect}>
                  <option value="ceo">{f('رئيس / مدير','CEO / Manager')}</option>
                  <option value="dept">{f('قسم','Department')}</option>
                  <option value="employee">{f('موظف','Employee')}</option>
                </select>
              </div>
              <div>
                <label style={fLabel}>{f('اللون','Color')}</label>
                <input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value,bg:e.target.value+'22'})} style={{...fInput,padding:'6px',height:42,cursor:'pointer'}}/>
              </div>
              <div>
                <label style={fLabel}>{f('عدد الموظفين','Employee Count')}</label>
                <input type="number" min={0} value={form.employees} onChange={e=>setForm({...form,employees:Number(e.target.value)})} style={fInput}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={handleSubmit} disabled={!form.name && !form.nameEn} style={{ flex:1, background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'11px', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                <Check size={16}/>{editingNode?f('حفظ التعديلات','Save Changes'):f('إضافة','Add')}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding:'11px 20px', borderRadius:11, border:'1.5px solid #e0e3e9', background:'#fff', color:'#64748b', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                {f('إلغاء','Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEADS PDF REPORT ─────────────────────────────────────────────────────────
function generateLeadsReport(filteredLeads, filters, users, lang, stages) {
  stages = stages || LEADS_STAGES;
  const rtl = lang === 'ar';
  const stageMap = Object.fromEntries(stages.map(s => [s.id, lang==='ar'?s.ar:s.en]));
  const perAgent = users.reduce((acc, u) => {
    const agentLeads = filteredLeads.filter(l => l.agentId === u.agentId);
    if (agentLeads.length > 0) acc[u.agentId] = { name: lang==='ar'?u.name:u.nameEn, leads: agentLeads };
    return acc;
  }, {});
  const perStage = stages.map(s => ({ ...s, count: filteredLeads.filter(l=>l.stage===s.id).length }));
  const dateStr = new Date().toLocaleDateString(lang==='ar'?'ar-AE':'en-AE',{year:'numeric',month:'long',day:'numeric'});

  return `<!DOCTYPE html>
<html dir="${rtl?'rtl':'ltr'}" lang="${lang}">
<head><meta charset="UTF-8"><title>MAKAN — Leads Report</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Tajawal','Segoe UI',sans-serif;color:#1a1a2e;background:#fff;padding:32px 40px;font-size:13px}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:3px solid #4F46E5;margin-bottom:24px}
.logo{font-size:22px;font-weight:900;letter-spacing:2px;color:#4F46E5}
.title{font-size:18px;font-weight:900;color:#1a1a2e}
.date{font-size:11px;color:#888;margin-top:4px}
.section-title{font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e8eaf0}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat{background:#f8fafc;border-radius:10px;padding:12px;text-align:center;border-top:3px solid #4F46E5}
.stat-val{font-size:26px;font-weight:900;color:#0f172a}
.stat-lbl{font-size:10px;color:#94a3b8;font-weight:700;margin-top:4px}
.stages{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}
.stage-chip{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}
table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px}
th{background:#f1f5f9;padding:8px 10px;text-align:${rtl?'right':'left'};font-weight:800;color:#475569;font-size:10px;text-transform:uppercase}
td{padding:8px 10px;border-bottom:1px solid #f1f5f9;color:#0f172a}
.agent-section{margin-bottom:20px}
.agent-header{background:#f8fafc;padding:8px 12px;border-radius:8px;font-weight:800;font-size:13px;margin-bottom:8px;display:flex;justify-content:space-between}
@media print{body{padding:16px 20px}}
</style></head>
<body>
<div class="header">
  <div><div class="logo">MAKAN</div><div style="font-size:10px;color:#4F46E5;font-weight:700;letter-spacing:3px">LEADS CRM REPORT</div></div>
  <div style="text-align:${rtl?'left':'right'}"><div class="title">${lang==='ar'?'تقرير الليدات':'Leads Report'}</div><div class="date">${dateStr}</div><div style="font-size:11px;color:#888;margin-top:4px">${lang==='ar'?`إجمالي الليدات: ${filteredLeads.length}`:`Total Leads: ${filteredLeads.length}`}</div></div>
</div>

<div class="section-title">${lang==='ar'?'إحصائيات سريعة':'Quick Stats'}</div>
<div class="stats">
  <div class="stat" style="border-color:#4F46E5"><div class="stat-val">${filteredLeads.length}</div><div class="stat-lbl">${lang==='ar'?'إجمالي الليدات':'Total Leads'}</div></div>
  <div class="stat" style="border-color:#10b981"><div class="stat-val">${filteredLeads.filter(l=>l.stage==='good').length}</div><div class="stat-lbl">${lang==='ar'?'ليد ممتاز':'Good Leads'}</div></div>
  <div class="stat" style="border-color:#f97316"><div class="stat-val">${filteredLeads.filter(l=>l.stage==='in_progress').length}</div><div class="stat-lbl">${lang==='ar'?'قيد المتابعة':'In Progress'}</div></div>
  <div class="stat" style="border-color:#ef4444"><div class="stat-val">${filteredLeads.filter(l=>l.stage==='junk').length}</div><div class="stat-lbl">${lang==='ar'?'ليد فاشل':'Junk Leads'}</div></div>
</div>

<div class="section-title">${lang==='ar'?'توزيع المراحل':'Stage Distribution'}</div>
<div class="stages">
  ${perStage.filter(s=>s.count>0).map(s=>`<span class="stage-chip" style="background:${s.color}18;color:${s.color};border:1px solid ${s.color}44">${lang==='ar'?s.ar:s.en}: ${s.count}</span>`).join('')}
</div>

<div class="section-title">${lang==='ar'?'قائمة الليدات':'Leads List'}</div>
<table>
<thead><tr><th>#</th><th>${lang==='ar'?'الاسم':'Name'}</th><th>${lang==='ar'?'الهاتف':'Phone'}</th><th>${lang==='ar'?'الميزانية':'Budget'}</th><th>${lang==='ar'?'المرحلة':'Stage'}</th><th>${lang==='ar'?'الإيجنت':'Agent'}</th><th>${lang==='ar'?'المصدر':'Source'}</th></tr></thead>
<tbody>
${filteredLeads.map((l,i)=>`<tr><td>${i+1}</td><td style="font-weight:700">${l.name}</td><td dir="ltr">${l.phone||'-'}</td><td>${l.budget?Number(l.budget).toLocaleString()+' AED':'-'}</td><td><span style="background:${stages.find(s=>s.id===l.stage)?.color||'#888'}18;color:${stages.find(s=>s.id===l.stage)?.color||'#888'};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">${stageMap[l.stage]||l.stage}</span></td><td>${l.agentName||'-'}</td><td>${l.source||'-'}</td></tr>`).join('')}
</tbody></table>

${Object.keys(perAgent).length>0?`
<div class="section-title">${lang==='ar'?'أداء الإيجنتس':'Agent Performance'}</div>
${Object.entries(perAgent).map(([agentId,{name,leads:al}])=>`
<div class="agent-section">
<div class="agent-header"><span>${name} <span style="font-size:10px;color:#94a3b8;font-family:monospace">${agentId}</span></span><span>${al.length} ${lang==='ar'?'ليد':'leads'}</span></div>
<div class="stages">${stages.map(s=>{const c=al.filter(l=>l.stage===s.id).length;return c>0?`<span class="stage-chip" style="background:${s.color}18;color:${s.color};border:1px solid ${s.color}44">${lang==='ar'?s.ar:s.en}: ${c}</span>`:''}).join('')}</div>
</div>`).join('')}
`:''}

<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e8eaf0;display:flex;justify-content:space-between;font-size:10px;color:#bbb">
<span>MAKAN Property OS © 2025 — REAL KHALED</span>
<span>${lang==='ar'?'هذا التقرير سري':'This report is confidential'}</span>
</div>
</body></html>`;
}

// ─── LEADS CRM VIEW ───────────────────────────────────────────────────────────
function LeadsCRMView({ lang, f, rtl, roleStyle, leads, onAddLead, onUpdateLead, onDeleteLead, users, orgNodes, onUpdateOrgNode, metaConfig, onSaveMeta, currentUser, leadsStages, onSaveStages }) {
  const [dragLeadId,    setDragLeadId]    = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [selectedLead,  setSelectedLead]  = useState(null);
  const [showMeta,      setShowMeta]      = useState(false);
  const [showDist,      setShowDist]      = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);
  const [metaSyncing,   setMetaSyncing]   = useState(false);
  const [metaMsg,       setMetaMsg]       = useState('');
  const [metaForm,      setMetaForm]      = useState({ token: metaConfig.token||'', formId: metaConfig.formId||'' });
  const [filters,       setFilters]       = useState({ stage:'all', agentId:'all', source:'all', campaign:'', dateFrom:'', dateTo:'' });
  const [distTarget,    setDistTarget]    = useState('person');
  const [distAgentId,   setDistAgentId]   = useState('');
  const [distNodeId,    setDistNodeId]    = useState('');
  const [selectedIds,   setSelectedIds]   = useState([]);
  const [selectMode,    setSelectMode]    = useState(false);
  const [showStagesMgr, setShowStagesMgr] = useState(false);
  const [editingStage,  setEditingStage]  = useState(null); // stage being edited inline
  const [newStageForm,  setNewStageForm]  = useState({ ar:'', en:'', color:'#6366f1', border:'#c7d2fe' });
  const emptyForm = { name:'', phone:'', email:'', budget:'', source:'manual', stage:'unassigned', agentId:'', notes:'', campaign:'' };
  const [form,          setForm]          = useState(emptyForm);
  const [importStatus,  setImportStatus]  = useState('');
  const metaCsvRef  = useRef(null);
  const xlsxRef     = useRef(null);

  const agents = users.filter(u => u.role === 'sales' || u.role === 'admin' || u.role === 'listing');
  const canAssign      = currentUser.role === 'admin' || can(currentUser,'assign_leads');
  const canPullMeta    = currentUser.role === 'admin' || can(currentUser,'pull_meta');
  const canReport      = currentUser.role === 'admin' || can(currentUser,'view_reports');
  const canMgmtStages  = currentUser.role === 'admin' || can(currentUser,'manage_stages');

  const handleDragStart = (e, leadId) => { if(selectMode)return; setDragLeadId(leadId); e.dataTransfer.effectAllowed='move'; };
  const handleDragOver  = (e, sid)    => { e.preventDefault(); e.dataTransfer.dropEffect='move'; setDragOverStage(sid); };
  const handleDrop      = (e, sid)    => {
    e.preventDefault();
    if (dragLeadId) onUpdateLead(dragLeadId, { stage: sid, updatedAt: new Date().toISOString() });
    setDragLeadId(null); setDragOverStage(null);
  };

  const handleAddLead = () => {
    if (!form.name) return;
    const agent = users.find(u => u.agentId === form.agentId);
    onAddLead({
      ...form, id:'lead'+Date.now(),
      agentName: agent ? (lang==='ar'?agent.name:agent.nameEn) : '',
      budget: form.budget ? Number(form.budget) : 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    setForm(emptyForm); setShowAddForm(false);
  };

  // ── Meta API Sync ─────────────────────────────────────────────────────────
  const handleMetaSync = async () => {
    if (!metaForm.token || !metaForm.formId) return;
    setMetaSyncing(true); setMetaMsg('');
    try {
      let result;
      if (window.metaAPI?.fetchLeads) {
        result = await window.metaAPI.fetchLeads({ token: metaForm.token, formId: metaForm.formId, since: metaConfig.lastSync ? Math.floor(new Date(metaConfig.lastSync).getTime()/1000) : null });
      } else {
        const url = `https://graph.facebook.com/v19.0/${metaForm.formId}/leads?access_token=${metaForm.token}&limit=100&fields=field_data,created_time,id,ad_name,campaign_name`;
        const res = await fetch(url);
        result = await res.json();
        if (result.error) { result = { ok:false, error:result.error.message }; }
        else { result = { ok:true, data: result.data||[] }; }
      }
      if (!result.ok) { setMetaMsg(`❌ ${result.error}`); setMetaSyncing(false); return; }
      let count = 0;
      const existingIds = leads.map(l=>l.meta_id).filter(Boolean);
      for (const raw of (result.data||[])) {
        if (existingIds.includes(raw.id)) continue;
        const fd = Object.fromEntries((raw.field_data||[]).map(f=>[f.name, f.values?.[0]||'']));
        const name  = fd.full_name||fd.first_name||(fd.first_name?`${fd.first_name} ${fd.last_name||''}`.trim():'')||'';
        const phone = fd.phone_number||fd.phone||'';
        const email = fd.email||'';
        if (!name&&!phone) continue;
        onAddLead({ id:'lead'+Date.now()+count, meta_id:raw.id, name:name||phone, phone, email, budget:0, source:'meta', stage:'unassigned', agentId:'', agentName:'', notes:'', campaign:raw.campaign_name||raw.ad_name||'', createdAt:raw.created_time||new Date().toISOString(), updatedAt:new Date().toISOString() });
        count++;
      }
      onSaveMeta({ ...metaForm, lastSync: new Date().toISOString() });
      setMetaMsg(f(`✅ تم سحب ${count} ليد جديد`,`✅ Imported ${count} new leads`));
    } catch(err) {
      setMetaMsg(`❌ ${err.message} (${f('يعمل فقط في Electron','Works only in Electron app')})`);
    }
    setMetaSyncing(false);
    setTimeout(()=>setMetaMsg(''),6000);
  };

  // ── CSV import (Meta CSV export) ──────────────────────────────────────────
  const handleMetaCsv = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = ev.target.result.split(/\r?\n/).filter(r=>r.trim());
      if (rows.length < 2) { setImportStatus(f('الملف فارغ','Empty file')); return; }
      const headers = rows[0].split(',').map(h=>h.trim().toLowerCase().replace(/['"]/g,''));
      let count=0;
      for (let i=1; i<rows.length; i++) {
        const cols=rows[i].split(',').map(c=>c.trim().replace(/^["']|["']$/g,''));
        const get=(kws)=>{const idx=headers.findIndex(h=>kws.some(k=>h.includes(k)));return idx>=0?cols[idx]:''};
        const name=get(['full_name','name'])||cols[0];
        const phone=get(['phone','mobile']);
        const email=get(['email']);
        const campaign=get(['campaign','ad_name','ad name']);
        if(!name) continue;
        onAddLead({id:'lead'+Date.now()+i, name, phone, email, budget:0, source:'meta', campaign, stage:'unassigned', agentId:'', agentName:'', notes:'', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()});
        count++;
      }
      setImportStatus(f(`✅ ${count} ليد من CSV`,`✅ ${count} leads from CSV`));
      setTimeout(()=>setImportStatus(''),4000);
      if(metaCsvRef.current)metaCsvRef.current.value='';
    };
    reader.readAsText(file);
  };

  // ── Excel import (.xlsx) ──────────────────────────────────────────────────
  const handleXlsx = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type:'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval:'' });
        let count=0;
        rows.forEach((row,i) => {
          const keys = Object.keys(row).map(k=>k.toLowerCase());
          const get=(kws)=>{const k=Object.keys(row).find(k=>kws.some(w=>k.toLowerCase().includes(w)));return k?String(row[k]).trim():''};
          const name  = get(['name','اسم','full']);
          const phone = get(['phone','هاتف','mobile','رقم']);
          const email = get(['email','بريد']);
          const budget= get(['budget','ميزانية','price','سعر']);
          const campaign=get(['campaign','حملة','ad']);
          if(!name&&!phone) return;
          onAddLead({id:'lead'+Date.now()+i, name:name||phone, phone, email, budget:budget?Number(String(budget).replace(/[^0-9.]/g,'')):0, source:'excel', campaign, stage:'unassigned', agentId:'', agentName:'', notes:'', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()});
          count++;
        });
        setImportStatus(f(`✅ ${count} ليد من Excel`,`✅ ${count} leads from Excel`));
        setTimeout(()=>setImportStatus(''),4000);
        if(xlsxRef.current)xlsxRef.current.value='';
      } catch(err) { setImportStatus(`❌ ${err.message}`); }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Distribution logic ─────────────────────────────────────────────────────
  const handleDistribute = () => {
    const toDistribute = selectedIds.length > 0 ? selectedIds : leads.filter(l=>l.stage==='unassigned').map(l=>l.id);
    if (toDistribute.length===0) return;
    if (distTarget==='person') {
      const agent = users.find(u=>u.agentId===distAgentId);
      if (!agent) return;
      toDistribute.forEach(id => onUpdateLead(id, { agentId:agent.agentId, agentName:lang==='ar'?agent.name:agent.nameEn, stage:'new', updatedAt:new Date().toISOString() }));
    } else {
      const node = orgNodes.find(n=>n.id===distNodeId);
      const memberIds = node?.memberIds||[];
      const members = users.filter(u=>memberIds.includes(u.id));
      if (members.length===0) return;
      toDistribute.forEach((id,idx) => {
        const agent = members[idx%members.length];
        onUpdateLead(id, { agentId:agent.agentId, agentName:lang==='ar'?agent.name:agent.nameEn, stage:'new', updatedAt:new Date().toISOString() });
      });
    }
    setSelectedIds([]); setSelectMode(false); setShowDist(false);
  };

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredLeads = leads.filter(l => {
    if (filters.stage!=='all' && l.stage!==filters.stage) return false;
    if (filters.agentId!=='all' && l.agentId!==filters.agentId) return false;
    if (filters.source!=='all' && l.source!==filters.source) return false;
    if (filters.campaign && !l.campaign?.toLowerCase().includes(filters.campaign.toLowerCase())) return false;
    if (filters.dateFrom && new Date(l.createdAt)<new Date(filters.dateFrom)) return false;
    if (filters.dateTo   && new Date(l.createdAt)>new Date(filters.dateTo+'T23:59:59')) return false;
    return true;
  });
  const isFiltered = filters.stage!=='all'||filters.agentId!=='all'||filters.source!=='all'||filters.campaign||filters.dateFrom||filters.dateTo;

  const SRC = {
    meta:     { bg:'#1877f214', color:'#1877f2', label:'Meta' },
    manual:   { bg:'#64748b14', color:'#64748b', label:f('يدوي','Manual') },
    website:  { bg:'#10b98114', color:'#10b981', label:f('الموقع','Website') },
    referral: { bg:'#f59e0b14', color:'#f59e0b', label:f('إحالة','Referral') },
    whatsapp: { bg:'#25d36614', color:'#25d366', label:'WhatsApp' },
    excel:    { bg:'#16a34a14', color:'#16a34a', label:'Excel' },
  };

  const stageLeads = sid => filteredLeads.filter(l => l.stage === sid);

  const handleReport = () => {
    const html = generateLeadsReport(filteredLeads, filters, users, lang, leadsStages);
    const win = window.open('','_blank','width=1000,height=750');
    if (!win) { alert(f('يرجى السماح بالنوافذ المنبثقة','Please allow pop-ups')); return; }
    win.document.write(html); win.document.close();
    setTimeout(()=>{ win.focus(); win.print(); }, 700);
  };

  return (
    <div dir={rtl?'rtl':'ltr'}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:10 }}>
            <Kanban size={22} color={roleStyle.accent}/>{f('إدارة الليدات','Leads CRM')}
          </h1>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>
            {f(`${filteredLeads.length} من ${leads.length} ليد`,`${filteredLeads.length} of ${leads.length} leads`)}
            {isFiltered && <span style={{ marginRight:6, marginLeft:6, background:'#fef3c7', color:'#92400e', borderRadius:20, padding:'1px 8px', fontSize:11, fontWeight:700 }}>{f('مفلترة','Filtered')}</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
          {importStatus && <span style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:8, padding:'5px 11px', fontSize:12, fontWeight:700, color:'#065f46' }}>{importStatus}</span>}

          {/* Filter toggle */}
          <button onClick={()=>setShowFilters(!showFilters)} className="makan-btn-tool" style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, background:isFiltered?'#fef3c7':roleStyle.light, border:`1.5px solid ${isFiltered?'#f59e0b':roleStyle.accent+'44'}`, color:isFiltered?'#92400e':roleStyle.accent, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
            <Filter size={13}/>{f('فلتر','Filter')} {isFiltered&&'●'}
          </button>

          {/* Select mode */}
          {canAssign && (
            <button onClick={()=>{setSelectMode(!selectMode);setSelectedIds([]);}} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, background:selectMode?roleStyle.accent:roleStyle.light, border:`1.5px solid ${roleStyle.accent}44`, color:selectMode?'#fff':roleStyle.accent, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
              <CheckCircle2 size={13}/>{selectMode?f(`${selectedIds.length} محدد`,`${selectedIds.length} selected`):f('تحديد','Select')}
            </button>
          )}

          {/* Distribute */}
          {canAssign && (selectMode ? selectedIds.length>0 : true) && (
            <button onClick={()=>setShowDist(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, background:'#10b98114', border:'1.5px solid #10b98166', color:'#10b981', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
              <Users size={13}/>{f('توزيع الليدات','Distribute')}
            </button>
          )}

          {/* Report */}
          {canReport && (
            <button onClick={handleReport} className="makan-btn-tool makan-btn-pdf" style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, background:'#f5f3ff', border:'1.5px solid #ddd6fe', color:'#7c3aed', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo','Tajawal','Segoe UI',sans-serif" }}>
              <Printer size={13}/>{f('تقرير PDF','PDF Report')}
            </button>
          )}

          {/* Meta sync */}
          {canPullMeta && (
            <button onClick={()=>setShowMeta(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, background:'#1877f214', border:'1.5px solid #1877f266', color:'#1877f2', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
              <Download size={13}/>Meta API
            </button>
          )}

          {/* CSV import */}
          <input ref={metaCsvRef} type="file" accept=".csv" onChange={handleMetaCsv} style={{ display:'none' }} id="meta-csv-upload"/>
          <label htmlFor="meta-csv-upload" className="makan-btn-tool makan-btn-csv" style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, background:'rgba(255,255,255,0.8)', border:'1.5px solid #e0e3e9', color:'#64748b', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo','Tajawal','Segoe UI',sans-serif" }}>
            <FileText size={13}/>CSV
          </label>

          {/* Excel import */}
          <input ref={xlsxRef} type="file" accept=".xlsx,.xls" onChange={handleXlsx} style={{ display:'none' }} id="xlsx-upload"/>
          <label htmlFor="xlsx-upload" className="makan-btn-tool makan-btn-excel" style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, background:'#16a34a14', border:'1.5px solid #16a34a66', color:'#16a34a', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Cairo','Tajawal','Segoe UI',sans-serif" }}>
            <FileText size={13}/>Excel
          </label>

          <button onClick={()=>setShowAddForm(true)} style={{ background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:"'Tajawal','Segoe UI',sans-serif", boxShadow:`0 4px 14px ${roleStyle.accent}44` }}>
            <Plus size={14}/>{f('إضافة ليد','Add Lead')}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{ ...GLASS, borderRadius:16, padding:'1rem 1.25rem', marginBottom:'1rem', border:`1.5px solid ${isFiltered?'#f59e0b44':'rgba(255,255,255,0.6)'}` }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div>
              <label style={fLabel}>{f('المرحلة','Stage')}</label>
              <select value={filters.stage} onChange={e=>setFilters({...filters,stage:e.target.value})} style={{...fSelect,width:140}}>
                <option value="all">{f('الكل','All')}</option>
                {leadsStages.map(s=><option key={s.id} value={s.id}>{lang==='ar'?s.ar:s.en}</option>)}
              </select>
            </div>
            <div>
              <label style={fLabel}>{f('الإيجنت','Agent')}</label>
              <select value={filters.agentId} onChange={e=>setFilters({...filters,agentId:e.target.value})} style={{...fSelect,width:160}}>
                <option value="all">{f('الكل','All')}</option>
                {agents.map(a=><option key={a.agentId} value={a.agentId}>{lang==='ar'?a.name:a.nameEn}</option>)}
              </select>
            </div>
            <div>
              <label style={fLabel}>{f('المصدر','Source')}</label>
              <select value={filters.source} onChange={e=>setFilters({...filters,source:e.target.value})} style={{...fSelect,width:130}}>
                <option value="all">{f('الكل','All')}</option>
                {Object.entries(SRC).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={fLabel}>{f('الحملة','Campaign')}</label>
              <input value={filters.campaign} onChange={e=>setFilters({...filters,campaign:e.target.value})} style={{...fInput,width:140}} placeholder={f('اسم الحملة...','Campaign name...')}/>
            </div>
            <div>
              <label style={fLabel}>{f('من تاريخ','From')}</label>
              <input type="date" value={filters.dateFrom} onChange={e=>setFilters({...filters,dateFrom:e.target.value})} style={{...fInput,width:140,direction:'ltr'}}/>
            </div>
            <div>
              <label style={fLabel}>{f('إلى تاريخ','To')}</label>
              <input type="date" value={filters.dateTo} onChange={e=>setFilters({...filters,dateTo:e.target.value})} style={{...fInput,width:140,direction:'ltr'}}/>
            </div>
            {isFiltered && (
              <button onClick={()=>setFilters({stage:'all',agentId:'all',source:'all',campaign:'',dateFrom:'',dateTo:''})} style={{ padding:'8px 14px', borderRadius:9, background:'#fff2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                <X size={13}/> {f('إزالة الفلتر','Clear')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display:'flex', gap:7, marginBottom:'1rem', overflowX:'auto', paddingBottom:4, alignItems:'center' }}>
        {leadsStages.map(s => {
          const cnt = stageLeads(s.id).length;
          return (
            <div key={s.id} className={`makan-stage-pill${filters.stage===s.id?' makan-stage-pill--active':''}`} onClick={()=>setFilters(fv=>({...fv,stage:fv.stage===s.id?'all':s.id}))} style={{ background:'#fff', borderRadius:10, padding:'6px 12px', display:'flex', alignItems:'center', gap:7, flexShrink:0, cursor:'pointer', border:`1.5px solid ${filters.stage===s.id?s.color:s.border}`, boxShadow: filters.stage===s.id?`0 2px 10px ${s.color}33`:'0 1px 4px rgba(0,0,0,0.05)', transition:'all .15s', '--s-color':s.color }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
              <div style={{ fontSize:15, fontWeight:900, color:'#0f172a', lineHeight:1 }}>{cnt}</div>
              <div style={{ fontSize:10, color:'#64748b', fontWeight:700, whiteSpace:'nowrap' }}>{lang==='ar'?s.ar:s.en}</div>
            </div>
          );
        })}
        {canMgmtStages && (
          <button onClick={()=>setShowStagesMgr(true)} title={f('إدارة المراحل','Manage Stages')} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:10, background:'#f8fafc', border:'1.5px dashed #cbd5e1', color:'#64748b', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap' }}>
            <Settings size={13}/>{f('إدارة المراحل','Manage Stages')}
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:16, alignItems:'flex-start' }}>
        {leadsStages.map(stage => {
          const colLeads = stageLeads(stage.id);
          const isDragOver = dragOverStage === stage.id;
          return (
            <div key={stage.id}
              onDragOver={e=>handleDragOver(e,stage.id)}
              onDrop={e=>handleDrop(e,stage.id)}
              onDragLeave={()=>setDragOverStage(null)}
              className="makan-kanban-col"
              style={{
                flex:'0 0 210px', minWidth:210,
                display:'flex', flexDirection:'column', gap:8,
                background: isDragOver ? `${stage.color}12` : 'rgba(248,250,252,0.7)',
                borderRadius:16, padding:'10px',
                border:`2px solid ${isDragOver ? stage.color : stage.border}`,
                transition:'all .18s', minHeight:380,
                backdropFilter:'blur(12px)',
                '--stage-color': stage.color,
              }}
            >
              {/* Column header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'2px 2px 6px', borderBottom:`1.5px solid ${stage.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:stage.color }}/>
                  <div className="makan-kanban-stage-name" style={{ fontSize:11, fontWeight:800, color:'#0f172a' }}>{lang==='ar'?stage.ar:stage.en}</div>
                </div>
                <div style={{ background:stage.color, color:'#fff', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, flexShrink:0 }}>{colLeads.length}</div>
              </div>

              {/* Lead cards */}
              {colLeads.map(lead => {
                const src = SRC[lead.source] || SRC.manual;
                const isDragging = dragLeadId === lead.id;
                const isSelected = selectedIds.includes(lead.id);
                return (
                  <div key={lead.id}
                    className="makan-kanban-card"
                    draggable={!selectMode}
                    onDragStart={e=>handleDragStart(e,lead.id)}
                    onDragEnd={()=>{setDragLeadId(null);setDragOverStage(null);}}
                    onClick={() => selectMode ? setSelectedIds(prev=>prev.includes(lead.id)?prev.filter(x=>x!==lead.id):[...prev,lead.id]) : setSelectedLead(lead)}
                    style={{
                      background: isSelected?`${roleStyle.accent}0e`:'#fff',
                      borderRadius:11, padding:'10px 11px',
                      cursor: selectMode?'pointer':'grab',
                      border: `1.5px solid ${isSelected?roleStyle.accent:'rgba(226,232,240,0.8)'}`,
                      boxShadow: isDragging?'none':'0 2px 8px rgba(0,0,0,0.06)',
                      opacity: isDragging?0.4:1, transition:'all .15s',
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:5 }}>
                      {selectMode && <div style={{ width:16,height:16,borderRadius:4,border:`2px solid ${isSelected?roleStyle.accent:'#cbd5e1'}`,background:isSelected?roleStyle.accent:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:6 }}>{isSelected&&<Check size={10} color="#fff"/>}</div>}
                      <div style={{ fontSize:12, fontWeight:800, color:'#0f172a', flex:1, lineHeight:1.3 }}>{lead.name}</div>
                      <span style={{ background:src.bg, color:src.color, fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:20, marginLeft:5, flexShrink:0 }}>{src.label}</span>
                    </div>
                    {lead.phone && <div style={{ fontSize:10, color:'#64748b', display:'flex', alignItems:'center', gap:4, marginBottom:3 }}><Phone size={9}/>{lead.phone}</div>}
                    {lead.campaign && <div style={{ fontSize:9, color:'#8b5cf6', marginBottom:3, fontWeight:600 }}>📢 {lead.campaign}</div>}
                    {lead.budget > 0 && <div style={{ fontSize:11, fontWeight:800, color:roleStyle.accent, marginBottom:3 }}>{Number(lead.budget).toLocaleString()} AED</div>}
                    <div style={{ fontSize:10, borderTop:'1px solid #f1f5f9', paddingTop:5, marginTop:4, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      {lead.agentName
                        ? <span style={{ color:'#64748b', display:'flex', alignItems:'center', gap:3 }}><User size={9}/>{lead.agentName}</span>
                        : <span style={{ color:'#f59e0b', display:'flex', alignItems:'center', gap:3 }}><AlertCircle size={9}/>{f('غير مسند','Unassigned')}</span>
                      }
                      <span style={{ color:'#cbd5e1' }}>{elapsedTime(lead.createdAt,lang)}</span>
                    </div>
                  </div>
                );
              })}

              <button onClick={() => { setForm({...emptyForm, stage:stage.id}); setShowAddForm(true); }} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px', borderRadius:10, border:`1.5px dashed ${stage.border}`, background:'transparent', color:'#94a3b8', fontSize:11, fontWeight:700, cursor:'pointer', marginTop:'auto', transition:'all .15s' }}>
                <Plus size={12}/>{f('إضافة','Add')}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── STAGES MANAGER MODAL ─────────────────────────────────────────────── */}
      {showStagesMgr && (
        <div onClick={()=>{setShowStagesMgr(false);setEditingStage(null);}} style={{ position:'fixed',inset:0,background:'rgba(10,14,30,0.75)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} className="makan-modal" style={{ background:'#fff',borderRadius:24,width:'100%',maxWidth:540,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 32px 100px rgba(10,14,30,0.40)',fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>

            {/* Header */}
            <div style={{ background:`linear-gradient(135deg,${PRIMARY},${PRIMARY}cc)`,padding:'1.25rem 1.5rem',borderRadius:'24px 24px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:18,fontWeight:900,color:'#fff' }}>{f('إدارة مراحل الليدات','Manage Lead Stages')}</div>
                <div style={{ fontSize:12,color:'rgba(255,255,255,0.75)',marginTop:3 }}>{f('أضف أو عدل أو احذف المراحل','Add, edit or delete stages')}</div>
              </div>
              <button onClick={()=>{setShowStagesMgr(false);setEditingStage(null);}} style={{ background:'rgba(255,255,255,0.20)',border:'1px solid rgba(255,255,255,0.30)',borderRadius:10,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff' }}>
                <X size={16}/>
              </button>
            </div>

            <div style={{ padding:'1.25rem',display:'flex',flexDirection:'column',gap:10 }}>

              {/* Existing stages list */}
              {leadsStages.map((stage, idx) => {
                const isEditing = editingStage?.id === stage.id;
                const stageLeadCount = leads.filter(l=>l.stage===stage.id).length;
                return (
                  <div key={stage.id} style={{ background: isEditing?`${stage.color}08`:'#f8fafc', borderRadius:14, border:`1.5px solid ${isEditing?stage.color:'#e2e8f0'}`, overflow:'hidden', transition:'all .2s' }}>
                    {/* Stage row */}
                    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px' }}>
                      <div style={{ width:14,height:14,borderRadius:'50%',background:stage.color,flexShrink:0,boxShadow:`0 2px 6px ${stage.color}55` }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,fontWeight:800,color:'#0f172a' }}>{lang==='ar'?stage.ar:stage.en}</div>
                        <div style={{ fontSize:10,color:'#94a3b8',marginTop:1 }}>{stageLeadCount} {f('ليد','leads')} · #{stage.id}</div>
                      </div>
                      {/* Reorder */}
                      <div style={{ display:'flex',gap:4 }}>
                        <button disabled={idx===0} onClick={()=>{
                          const s=[...leadsStages]; [s[idx],s[idx-1]]=[s[idx-1],s[idx]]; onSaveStages(s);
                        }} style={{ background:'#f1f5f9',border:'none',borderRadius:6,width:26,height:26,cursor:idx===0?'not-allowed':'pointer',color:'#64748b',opacity:idx===0?.3:1,display:'flex',alignItems:'center',justifyContent:'center' }}>▲</button>
                        <button disabled={idx===leadsStages.length-1} onClick={()=>{
                          const s=[...leadsStages]; [s[idx],s[idx+1]]=[s[idx+1],s[idx]]; onSaveStages(s);
                        }} style={{ background:'#f1f5f9',border:'none',borderRadius:6,width:26,height:26,cursor:idx===leadsStages.length-1?'not-allowed':'pointer',color:'#64748b',opacity:idx===leadsStages.length-1?.3:1,display:'flex',alignItems:'center',justifyContent:'center' }}>▼</button>
                      </div>
                      <button onClick={()=>setEditingStage(isEditing?null:{...stage})} style={{ background:isEditing?`${stage.color}18`:'#f1f5f9',border:`1px solid ${isEditing?stage.color:'#e2e8f0'}`,borderRadius:8,padding:'5px 12px',cursor:'pointer',color:isEditing?stage.color:'#64748b',fontSize:11,fontWeight:700 }}>
                        {isEditing?f('إغلاق','Close'):f('تعديل','Edit')}
                      </button>
                      <button onClick={()=>{
                        if(stageLeadCount>0){alert(f(`لا يمكن الحذف — يوجد ${stageLeadCount} ليد في هذه المرحلة`,`Cannot delete — ${stageLeadCount} leads in this stage`));return;}
                        onSaveStages(leadsStages.filter(s=>s.id!==stage.id));
                      }} style={{ background:'#fff2f2',border:'1px solid #fecaca',borderRadius:8,padding:'5px 9px',cursor:'pointer',color:'#dc2626',display:'flex',alignItems:'center' }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>

                    {/* Inline edit form */}
                    {isEditing && editingStage && (
                      <div style={{ padding:'12px 14px',borderTop:`1px solid ${stage.color}22`,background:'#fff',display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,alignItems:'flex-end' }}>
                        <div>
                          <label style={fLabel}>{f('الاسم عربي','Arabic Name')}</label>
                          <input value={editingStage.ar} onChange={e=>setEditingStage({...editingStage,ar:e.target.value})} style={fInput}/>
                        </div>
                        <div>
                          <label style={fLabel}>{f('الاسم إنجليزي','English Name')}</label>
                          <input value={editingStage.en} onChange={e=>setEditingStage({...editingStage,en:e.target.value})} style={{...fInput,direction:'ltr'}}/>
                        </div>
                        <div>
                          <label style={fLabel}>{f('اللون','Color')}</label>
                          <input type="color" value={editingStage.color} onChange={e=>setEditingStage({...editingStage,color:e.target.value,border:e.target.value+'44'})} style={{...fInput,padding:'4px',height:42,cursor:'pointer',width:60}}/>
                        </div>
                        <div style={{ gridColumn:'1/-1',display:'flex',gap:8 }}>
                          <button onClick={()=>{
                            onSaveStages(leadsStages.map(s=>s.id===stage.id?{...s,...editingStage}:s));
                            setEditingStage(null);
                          }} style={{ flex:1,background:`linear-gradient(135deg,${PRIMARY},${PRIMARY}cc)`,color:'#fff',border:'none',borderRadius:10,padding:'9px',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                            <Check size={14}/>{f('حفظ التعديلات','Save Changes')}
                          </button>
                          <button onClick={()=>setEditingStage(null)} style={{ padding:'9px 16px',borderRadius:10,border:'1.5px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:13,fontWeight:700,cursor:'pointer' }}>
                            {f('إلغاء','Cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add new stage */}
              <div style={{ marginTop:8,background:'#f0f9ff',borderRadius:16,padding:'14px',border:'1.5px dashed #bae6fd' }}>
                <div style={{ fontSize:12,fontWeight:800,color:'#0284c7',marginBottom:12,display:'flex',alignItems:'center',gap:6 }}>
                  <Plus size={14}/>{f('إضافة مرحلة جديدة','Add New Stage')}
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,alignItems:'flex-end' }}>
                  <div>
                    <label style={fLabel}>{f('الاسم عربي','Arabic Name')}</label>
                    <input value={newStageForm.ar} onChange={e=>setNewStageForm({...newStageForm,ar:e.target.value})} style={fInput} placeholder={f('مثال: مهتم','e.g. Interested')}/>
                  </div>
                  <div>
                    <label style={fLabel}>{f('الاسم إنجليزي','English Name')}</label>
                    <input value={newStageForm.en} onChange={e=>setNewStageForm({...newStageForm,en:e.target.value})} style={{...fInput,direction:'ltr'}} placeholder="e.g. Interested"/>
                  </div>
                  <div>
                    <label style={fLabel}>{f('اللون','Color')}</label>
                    <input type="color" value={newStageForm.color} onChange={e=>setNewStageForm({...newStageForm,color:e.target.value,border:e.target.value+'44'})} style={{...fInput,padding:'4px',height:42,cursor:'pointer',width:60}}/>
                  </div>
                  <button onClick={()=>{
                    if(!newStageForm.ar && !newStageForm.en) return;
                    const id = 'stage_'+(newStageForm.en||newStageForm.ar).toLowerCase().replace(/\s+/g,'_')+Date.now();
                    onSaveStages([...leadsStages, { ...newStageForm, id }]);
                    setNewStageForm({ ar:'', en:'', color:'#6366f1', border:'#c7d2fe' });
                  }} disabled={!newStageForm.ar && !newStageForm.en} style={{ gridColumn:'1/-1',background:(!newStageForm.ar&&!newStageForm.en)?'#e2e8f0':`linear-gradient(135deg,${PRIMARY},${PRIMARY}cc)`,color:'#fff',border:'none',borderRadius:11,padding:'10px',fontSize:14,fontWeight:700,cursor:(!newStageForm.ar&&!newStageForm.en)?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                    <Plus size={16}/>{f('إضافة المرحلة','Add Stage')}
                  </button>
                </div>
              </div>

              {/* Reset to defaults */}
              <button onClick={()=>{if(window.confirm(f('هل تريد إعادة ضبط المراحل للإعدادات الافتراضية؟','Reset stages to defaults?'))) onSaveStages(LEADS_STAGES);}} style={{ alignSelf:'center',padding:'7px 18px',borderRadius:10,border:'1px solid #fde68a',background:'#fffbeb',color:'#92400e',fontSize:12,fontWeight:700,cursor:'pointer' }}>
                {f('إعادة الضبط للافتراضي','Reset to Defaults')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meta API Modal */}
      {showMeta && (
        <div onClick={()=>setShowMeta(false)} style={{ position:'fixed',inset:0,background:'rgba(15,20,40,0.55)',backdropFilter:'blur(4px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} className="makan-modal" style={{ background:'#fff',backdropFilter:'none',WebkitBackdropFilter:'none',borderRadius:20,width:'100%',maxWidth:480,padding:'1.75rem',boxShadow:'0 24px 80px rgba(15,23,42,0.28),inset 0 1px 0 rgba(255,255,255,0.90)' }}>
            <h3 style={{ fontSize:17,fontWeight:800,color:'#0f172a',marginBottom:6,display:'flex',alignItems:'center',gap:8 }}>
              <Download size={17} color="#1877f2"/>{f('سحب الليدات من Meta','Pull Leads from Meta')}
            </h3>
            <p style={{ fontSize:12,color:'#94a3b8',marginBottom:'1.25rem' }}>{f('ادخل بيانات Meta Business Manager لسحب الليدات تلقائياً','Enter Meta Business Manager credentials to auto-pull leads')}</p>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <div>
                <label style={fLabel}>{f('رمز وصول الصفحة','Page Access Token')}</label>
                <input value={metaForm.token} onChange={e=>setMetaForm({...metaForm,token:e.target.value})} style={{...fInput,direction:'ltr',fontFamily:'monospace',fontSize:12}} placeholder="EAAxxxxxxxxxxxxxxx..."/>
                <p style={{ fontSize:10,color:'#94a3b8',marginTop:4 }}>{f('من Meta Business Suite → إعدادات → رموز الوصول','From Meta Business Suite → Settings → Access Tokens')}</p>
              </div>
              <div>
                <label style={fLabel}>{f('معرف نموذج الليدات','Lead Form ID')}</label>
                <input value={metaForm.formId} onChange={e=>setMetaForm({...metaForm,formId:e.target.value})} style={{...fInput,direction:'ltr',fontFamily:'monospace'}} placeholder="123456789012345"/>
                <p style={{ fontSize:10,color:'#94a3b8',marginTop:4 }}>{f('من Meta Ads Manager → Lead Ads → معرف النموذج','From Meta Ads Manager → Lead Ads → Form ID')}</p>
              </div>
              {metaConfig.lastSync && <div style={{ background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#16a34a',fontWeight:700 }}>{f('آخر مزامنة:','Last sync:')} {new Date(metaConfig.lastSync).toLocaleString(lang==='ar'?'ar-AE':'en-AE')}</div>}
              {metaMsg && <div style={{ background:metaMsg.includes('❌')?'#fff2f2':'#ecfdf5',border:`1px solid ${metaMsg.includes('❌')?'#fecaca':'#a7f3d0'}`,borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:700,color:metaMsg.includes('❌')?'#dc2626':'#065f46' }}>{metaMsg}</div>}
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={handleMetaSync} disabled={metaSyncing||!metaForm.token||!metaForm.formId} style={{ flex:1,background:(metaSyncing||!metaForm.token||!metaForm.formId)?'#e2e8f0':'#1877f2',color:'#fff',border:'none',borderRadius:11,padding:'11px',fontSize:14,fontWeight:700,cursor:(metaSyncing||!metaForm.token||!metaForm.formId)?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                  {metaSyncing?<RefreshCw size={16} style={{ animation:'spin 1s linear infinite' }}/>:<Download size={16}/>}
                  {metaSyncing?f('جاري السحب...','Syncing...'):f('سحب الليدات الآن','Sync Leads Now')}
                </button>
                <button onClick={()=>{onSaveMeta({...metaForm,lastSync:metaConfig.lastSync});setShowMeta(false);}} style={{ padding:'11px 16px',borderRadius:11,border:'1.5px solid #e0e3e9',background:'#fff',color:'#64748b',fontSize:13,fontWeight:700,cursor:'pointer' }}>{f('حفظ','Save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Modal */}
      {showDist && (
        <div onClick={()=>setShowDist(false)} style={{ position:'fixed',inset:0,background:'rgba(15,20,40,0.55)',backdropFilter:'blur(4px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} className="makan-modal" style={{ background:'#fff',backdropFilter:'none',WebkitBackdropFilter:'none',borderRadius:20,width:'100%',maxWidth:480,padding:'1.75rem',boxShadow:'0 24px 80px rgba(15,23,42,0.28),inset 0 1px 0 rgba(255,255,255,0.90)' }}>
            <h3 style={{ fontSize:17,fontWeight:800,color:'#0f172a',marginBottom:4,display:'flex',alignItems:'center',gap:8 }}>
              <Users size={17} color="#10b981"/>{f('توزيع الليدات','Distribute Leads')}
            </h3>
            <p style={{ fontSize:12,color:'#94a3b8',marginBottom:'1.25rem' }}>
              {selectedIds.length>0
                ? f(`توزيع ${selectedIds.length} ليد محدد`,`Distribute ${selectedIds.length} selected leads`)
                : f(`توزيع ${leads.filter(l=>l.stage==='unassigned').length} ليد غير مسند`,`Distribute ${leads.filter(l=>l.stage==='unassigned').length} unassigned leads`)}
            </p>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {/* Target type */}
              <div style={{ display:'flex',gap:8 }}>
                {[{v:'person',ar:'شخص محدد',en:'Specific Person'},{v:'team',ar:'فريق/قسم',en:'Team/Department'}].map(opt=>(
                  <button key={opt.v} onClick={()=>setDistTarget(opt.v)} style={{ flex:1,padding:'10px',borderRadius:11,border:`2px solid ${distTarget===opt.v?'#10b981':'#e0e3e9'}`,background:distTarget===opt.v?'#f0fdf4':'#fff',color:distTarget===opt.v?'#10b981':'#64748b',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .15s' }}>
                    {lang==='ar'?opt.ar:opt.en}
                  </button>
                ))}
              </div>

              {distTarget==='person' ? (
                <div>
                  <label style={fLabel}>{f('اختر الإيجنت','Choose Agent')}</label>
                  <select value={distAgentId} onChange={e=>setDistAgentId(e.target.value)} style={fSelect}>
                    <option value="">{f('-- اختر --','-- Select --')}</option>
                    {agents.map(a=><option key={a.agentId} value={a.agentId}>{lang==='ar'?a.name:a.nameEn} ({a.agentId})</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={fLabel}>{f('اختر القسم','Choose Department')}</label>
                  <select value={distNodeId} onChange={e=>setDistNodeId(e.target.value)} style={fSelect}>
                    <option value="">{f('-- اختر قسم --','-- Select Department --')}</option>
                    {orgNodes.filter(n=>n.type!=='ceo'&&(n.memberIds||[]).length>0).map(n=><option key={n.id} value={n.id}>{lang==='ar'?n.name:n.nameEn} ({(n.memberIds||[]).length} {f('عضو','members')})</option>)}
                  </select>
                  {distNodeId && (() => {
                    const node = orgNodes.find(n=>n.id===distNodeId);
                    const members = users.filter(u=>(node?.memberIds||[]).includes(u.id));
                    return members.length>0&&<div style={{ marginTop:8,fontSize:11,color:'#94a3b8' }}>{f('سيتم التوزيع على:','Will distribute to:')} {members.map(m=>lang==='ar'?m.name:m.nameEn).join('، ')}</div>;
                  })()}
                </div>
              )}

              <div style={{ display:'flex',gap:10 }}>
                <button onClick={handleDistribute} disabled={distTarget==='person'?!distAgentId:!distNodeId} style={{ flex:1,background:(distTarget==='person'?!distAgentId:!distNodeId)?'#e2e8f0':'#10b981',color:'#fff',border:'none',borderRadius:11,padding:'11px',fontSize:14,fontWeight:700,cursor:(distTarget==='person'?!distAgentId:!distNodeId)?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                  <Users size={16}/>{f('توزيع الآن','Distribute Now')}
                </button>
                <button onClick={()=>setShowDist(false)} style={{ padding:'11px 16px',borderRadius:11,border:'1.5px solid #e0e3e9',background:'#fff',color:'#64748b',fontSize:14,fontWeight:700,cursor:'pointer' }}>{f('إلغاء','Cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (() => {
        const stageInfo = leadsStages.find(s=>s.id===selectedLead.stage) || leadsStages[0];
        const srcInfo   = SRC[selectedLead.source] || SRC.manual;
        return (
          <div onClick={()=>setSelectedLead(null)} style={{ position:'fixed',inset:0,background:'rgba(10,14,30,0.75)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#ffffff',borderRadius:24,width:'100%',maxWidth:500,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 32px 100px rgba(10,14,30,0.40)',fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>

              {/* ── HEADER ── */}
              <div style={{ background:`linear-gradient(135deg,${stageInfo.color},${stageInfo.color}cc)`,padding:'1.4rem 1.5rem',borderRadius:'24px 24px 0 0',position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',top:-40,right:rtl?'auto':-30,left:rtl?-30:'auto',width:140,height:140,borderRadius:'50%',background:'rgba(255,255,255,0.10)',pointerEvents:'none' }}/>
                <button onClick={()=>setSelectedLead(null)} style={{ position:'absolute',top:14,right:rtl?'auto':14,left:rtl?14:'auto',background:'rgba(255,255,255,0.20)',border:'1px solid rgba(255,255,255,0.30)',borderRadius:10,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff' }}>
                  <X size={16}/>
                </button>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ background:'rgba(255,255,255,0.20)',borderRadius:14,width:48,height:48,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <User size={22} color="#fff"/>
                  </div>
                  <div>
                    <div style={{ fontSize:11,color:'rgba(255,255,255,0.80)',fontWeight:700,marginBottom:3,display:'flex',alignItems:'center',gap:6 }}>
                      <span style={{ background:'rgba(255,255,255,0.20)',borderRadius:20,padding:'2px 10px' }}>{lang==='ar'?stageInfo.ar:stageInfo.en}</span>
                      <span style={{ background:srcInfo.bg.replace('14','35'),borderRadius:20,padding:'2px 10px',color:'#fff',fontSize:10 }}>{srcInfo.label}</span>
                    </div>
                    <div style={{ fontSize:20,fontWeight:900,color:'#fff',lineHeight:1.2 }}>{selectedLead.name}</div>
                    {selectedLead.campaign && <div style={{ fontSize:11,color:'rgba(255,255,255,0.70)',marginTop:3 }}>📢 {selectedLead.campaign}</div>}
                  </div>
                </div>
                {/* Quick info bar */}
                <div style={{ display:'flex',gap:10,marginTop:'1rem',flexWrap:'wrap' }}>
                  {selectedLead.phone && (
                    <div style={{ background:'rgba(255,255,255,0.15)',borderRadius:10,padding:'7px 12px',display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(8px)' }}>
                      <Phone size={13} color="#fff"/>
                      <span style={{ fontSize:13,fontWeight:700,color:'#fff',direction:'ltr' }}>{selectedLead.phone}</span>
                    </div>
                  )}
                  {selectedLead.budget>0 && (
                    <div style={{ background:'rgba(255,255,255,0.15)',borderRadius:10,padding:'7px 12px',backdropFilter:'blur(8px)' }}>
                      <span style={{ fontSize:13,fontWeight:800,color:'#fff' }}>{Number(selectedLead.budget).toLocaleString()} <span style={{ fontSize:10,opacity:.7 }}>AED</span></span>
                    </div>
                  )}
                  {selectedLead.email && (
                    <div style={{ background:'rgba(255,255,255,0.15)',borderRadius:10,padding:'7px 12px',backdropFilter:'blur(8px)' }}>
                      <span style={{ fontSize:12,color:'#fff',direction:'ltr' }}>{selectedLead.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── BODY ── */}
              <div style={{ padding:'1.25rem',display:'flex',flexDirection:'column',gap:14 }}>

                {/* Stage quick-change */}
                <div>
                  <div style={{ fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1,marginBottom:10,display:'flex',alignItems:'center',gap:6 }}>
                    <div style={{ flex:1,height:1,background:'#e2e8f0' }}/>{f('تغيير المرحلة','Change Stage')}<div style={{ flex:1,height:1,background:'#e2e8f0' }}/>
                  </div>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                    {leadsStages.map(s => {
                      const isActive = selectedLead.stage===s.id;
                      return (
                        <button key={s.id} onClick={()=>{
                          onUpdateLead(selectedLead.id,{stage:s.id,updatedAt:new Date().toISOString()});
                          setSelectedLead(prev=>({...prev,stage:s.id}));
                        }} style={{
                          padding:'5px 12px',borderRadius:20,cursor:'pointer',fontSize:11,fontWeight:700,transition:'all .15s',
                          background: isActive?s.color:`${s.color}12`,
                          color: isActive?'#fff':s.color,
                          border: `1.5px solid ${isActive?s.color:s.border}`,
                          boxShadow: isActive?`0 2px 8px ${s.color}44`:'none',
                        }}>{lang==='ar'?s.ar:s.en}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Assign agent */}
                <div style={{ background:'#f8fafc',borderRadius:14,padding:'12px 14px',border:'1px solid #e2e8f0' }}>
                  <div style={{ fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.8,marginBottom:10,display:'flex',alignItems:'center',gap:6 }}>
                    <User size={11}/>{f('الإيجنت المسؤول','Assigned Agent')}
                  </div>
                  <select value={selectedLead.agentId||''} onChange={e=>{
                    const a=users.find(u=>u.agentId===e.target.value);
                    const updates={agentId:e.target.value,agentName:a?(lang==='ar'?a.name:a.nameEn):''};
                    onUpdateLead(selectedLead.id,updates);
                    setSelectedLead(prev=>({...prev,...updates}));
                  }} style={{ ...fSelect,background:'#fff',borderColor:'#e2e8f0' }}>
                    <option value="">{f('-- غير مسند --','-- Unassigned --')}</option>
                    {agents.map(a=><option key={a.agentId} value={a.agentId}>{lang==='ar'?a.name:a.nameEn} ({a.agentId})</option>)}
                  </select>
                  {selectedLead.agentName && (
                    <div style={{ marginTop:8,display:'flex',alignItems:'center',gap:7,padding:'7px 10px',background:'#fff',borderRadius:10,border:`1px solid ${roleStyle.accent}22` }}>
                      <div style={{ width:28,height:28,borderRadius:'50%',background:`${roleStyle.accent}18`,display:'flex',alignItems:'center',justifyContent:'center',color:roleStyle.accent,fontSize:11,fontWeight:800,flexShrink:0 }}>
                        {selectedLead.agentName.slice(0,2)}
                      </div>
                      <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>{selectedLead.agentName}</div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <div style={{ fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.8,marginBottom:8 }}>{f('ملاحظات','Notes')}</div>
                  <textarea value={selectedLead.notes||''} onChange={e=>{
                    onUpdateLead(selectedLead.id,{notes:e.target.value});
                    setSelectedLead(prev=>({...prev,notes:e.target.value}));
                  }} rows={3} placeholder={f('أضف ملاحظاتك هنا...','Add your notes here...')}
                    style={{ width:'100%',padding:'11px 14px',borderRadius:12,border:'1.5px solid #e2e8f0',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:"'Tajawal','Segoe UI',sans-serif",resize:'vertical',background:'#f8fafc',color:'#0f172a',minHeight:80,transition:'border-color .2s' }}
                    onFocus={e=>e.target.style.borderColor=stageInfo.color}
                    onBlur={e=>e.target.style.borderColor='#e2e8f0'}
                  />
                </div>

                {/* Meta info + delete */}
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:8,borderTop:'1px solid #f1f5f9' }}>
                  <div style={{ fontSize:11,color:'#94a3b8' }}>
                    {f('أُضيف','Added')} {elapsedTime(selectedLead.createdAt,lang)}
                  </div>
                  <button onClick={()=>{onDeleteLead(selectedLead.id);setSelectedLead(null);}} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'#fff2f2',border:'1.5px solid #fecaca',color:'#dc2626',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Tajawal','Segoe UI',sans-serif",transition:'all .15s' }}>
                    <Trash2 size={13}/>{f('حذف الليد','Delete Lead')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Lead Modal */}
      {showAddForm && (
        <div onClick={()=>setShowAddForm(false)} style={{ position:'fixed',inset:0,background:'rgba(15,20,40,0.55)',backdropFilter:'blur(4px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} style={{ ...GLASS,borderRadius:20,width:'100%',maxWidth:520,padding:'1.75rem',boxShadow:'0 24px 80px rgba(15,23,42,0.28),inset 0 1px 0 rgba(255,255,255,0.90)' }}>
            <h3 style={{ fontSize:17,fontWeight:800,color:'#0f172a',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:8 }}>
              <Plus size={17} color={roleStyle.accent}/>{f('إضافة ليد جديد','Add New Lead')}
            </h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('اسم العميل *','Client Name *')}</label>
                <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={fInput} placeholder={f('الاسم الكامل','Full Name')}/>
              </div>
              <div>
                <label style={fLabel}>{f('رقم الهاتف','Phone')}</label>
                <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{...fInput,direction:'ltr'}} placeholder="+971 xx xxx xxxx"/>
              </div>
              <div>
                <label style={fLabel}>Email</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{...fInput,direction:'ltr'}}/>
              </div>
              <div>
                <label style={fLabel}>{f('الميزانية (AED)','Budget (AED)')}</label>
                <input type="number" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} style={fInput} placeholder="0"/>
              </div>
              <div>
                <label style={fLabel}>{f('المصدر','Source')}</label>
                <select value={form.source} onChange={e=>setForm({...form,source:e.target.value})} style={fSelect}>
                  <option value="manual">{f('يدوي','Manual')}</option>
                  <option value="meta">Meta (Facebook/Instagram)</option>
                  <option value="website">{f('الموقع الإلكتروني','Website')}</option>
                  <option value="referral">{f('إحالة','Referral')}</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label style={fLabel}>{f('المرحلة','Stage')}</label>
                <select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})} style={fSelect}>
                  {leadsStages.map(s=><option key={s.id} value={s.id}>{lang==='ar'?s.ar:s.en}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('تعيين لإيجنت','Assign to Agent')}</label>
                <select value={form.agentId} onChange={e=>setForm({...form,agentId:e.target.value})} style={fSelect}>
                  <option value="">{f('غير مسند','Unassigned')}</option>
                  {agents.map(a=><option key={a.agentId} value={a.agentId}>{lang==='ar'?a.name:a.nameEn} ({a.agentId})</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={fLabel}>{f('ملاحظات','Notes')}</label>
                <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} style={{...fInput,resize:'vertical',height:'auto'}}/>
              </div>
            </div>
            <div style={{ display:'flex',gap:10,marginTop:16 }}>
              <button onClick={handleAddLead} disabled={!form.name} style={{ flex:1, background:form.name?`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`:'#e2e8f0', color:form.name?'#fff':'#94a3b8', border:'none',borderRadius:11,padding:'11px',fontSize:14,fontWeight:700,cursor:form.name?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:7,fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
                <Plus size={16}/>{f('إضافة الليد','Add Lead')}
              </button>
              <button onClick={()=>setShowAddForm(false)} style={{ padding:'11px 20px',borderRadius:11,border:'1.5px solid #e0e3e9',background:'#fff',color:'#64748b',fontSize:14,fontWeight:700,cursor:'pointer' }}>
                {f('إلغاء','Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ lang, f, rtl, roleStyle, calEvents, onAddEvent, onDeleteEvent, currentUser }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showForm, setShowForm] = useState(false);
  const [selDay, setSelDay]     = useState(null);
  const emptyEv = { title:'', titleEn:'', type:'meeting', time:'09:00', desc:'' };
  const [form, setForm] = useState(emptyEv);

  const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS_AR   = ['أح','إث','ثل','أر','خم','جم','سب'];
  const DAYS_EN   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const TYPE_COLORS = { meeting:'#4F46E5', task:'#10b981', reminder:'#f59e0b', event:'#ec4899' };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOnDay = (day) => calEvents.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  });

  const handleAdd = () => {
    if (!form.title && !form.titleEn) return;
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selDay).padStart(2,'0')}`;
    onAddEvent({ ...form, id:'cal'+Date.now(), date:dateStr, createdBy: currentUser.id });
    setShowForm(false); setForm(emptyEv);
  };

  return (
    <div dir={rtl?'rtl':'ltr'}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:10 }}>
          <Clock size={22} color={roleStyle.accent}/>{f('التقويم','Calendar')}
        </h1>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>{ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }} style={{ background:'#f1f5f9', border:'1.5px solid #e2e8f0', borderRadius:9, padding:'7px 12px', cursor:'pointer', color:'#475569', fontWeight:700, fontSize:14 }}>‹</button>
          <span style={{ fontSize:16, fontWeight:800, color:'#0f172a', minWidth:160, textAlign:'center' }}>
            {lang==='ar' ? MONTHS_AR[month] : MONTHS_EN[month]} {year}
          </span>
          <button onClick={()=>{ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }} style={{ background:'#f1f5f9', border:'1.5px solid #e2e8f0', borderRadius:9, padding:'7px 12px', cursor:'pointer', color:'#475569', fontWeight:700, fontSize:14 }}>›</button>
        </div>
      </div>

      <div className="makan-cal-wrapper" style={{ ...GLASS, borderRadius:20, overflow:'hidden', border:'1.5px solid #e2e8f0' }}>
        <div className="makan-cal-headers" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#f8fafc', borderBottom:'1.5px solid #e2e8f0' }}>
          {(lang==='ar'?DAYS_AR:DAYS_EN).map(d => (
            <div key={d} style={{ padding:'10px 0', textAlign:'center', fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:.8 }}>{d}</div>
          ))}
        </div>
        <div className="makan-cal-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {cells.map((day, i) => {
            const isToday = day && today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
            const dayEvs = day ? eventsOnDay(day) : [];
            return (
              <div key={i} className={day?'makan-cal-cell':'makan-cal-cell-empty'} onClick={()=>{ if(day){setSelDay(day);setShowForm(true);} }}
                style={{ minHeight:90, padding:'8px 6px', borderRight:'1px solid #f1f5f9', borderBottom:'1px solid #f1f5f9', background: day?'#fff':'#fafbfc', cursor:day?'pointer':'default' }}
              >
                {day && (
                  <>
                    <div style={{ width:28, height:28, borderRadius:'50%', background: isToday?roleStyle.accent:'transparent', color: isToday?'#fff':'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight: isToday?900:600, marginBottom:4 }}>{day}</div>
                    {dayEvs.slice(0,3).map(ev => (
                      <div key={ev.id} style={{ background: TYPE_COLORS[ev.type]+'18', color: TYPE_COLORS[ev.type], borderRadius:5, padding:'2px 6px', fontSize:10, fontWeight:700, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background: TYPE_COLORS[ev.type], flexShrink:0, display:'inline-block' }}/>
                        {lang==='ar'?ev.title:(ev.titleEn||ev.title)}
                        <button onClick={e=>{e.stopPropagation();onDeleteEvent(ev.id);}} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'inherit', opacity:.6, fontSize:10, padding:0, lineHeight:1, flexShrink:0 }}>✕</button>
                      </div>
                    ))}
                    {dayEvs.length > 3 && <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700 }}>+{dayEvs.length-3}</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div onClick={()=>setShowForm(false)} style={{ position:'fixed', inset:0, background:'rgba(15,20,40,0.55)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} className="makan-modal" style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:420, padding:'1.75rem', boxShadow:'0 24px 80px rgba(15,23,42,0.28)' }}>
            <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:'1rem', display:'flex', alignItems:'center', gap:8 }}>
              <Clock size={15} color={roleStyle.accent}/>{f('إضافة حدث','Add Event')} — {selDay} {lang==='ar'?MONTHS_AR[month]:MONTHS_EN[month]}
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={fLabel}>{f('العنوان','Title')}</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={fInput} placeholder={f('مثال: اجتماع فريق المبيعات','e.g. Sales team meeting')}/>
              </div>
              <div>
                <label style={fLabel}>{f('العنوان بالإنجليزية','English Title')}</label>
                <input value={form.titleEn} onChange={e=>setForm({...form,titleEn:e.target.value})} style={{...fInput,direction:'ltr'}}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={fLabel}>{f('النوع','Type')}</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={fSelect}>
                    <option value="meeting">{f('اجتماع','Meeting')}</option>
                    <option value="task">{f('مهمة','Task')}</option>
                    <option value="reminder">{f('تذكير','Reminder')}</option>
                    <option value="event">{f('حدث','Event')}</option>
                  </select>
                </div>
                <div>
                  <label style={fLabel}>{f('الوقت','Time')}</label>
                  <input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} style={{...fInput,direction:'ltr'}}/>
                </div>
              </div>
              <div>
                <label style={fLabel}>{f('الوصف','Description')}</label>
                <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} style={{...fInput,resize:'vertical',height:'auto'}}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={handleAdd} disabled={!form.title&&!form.titleEn} style={{ flex:1, background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'11px', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                <Plus size={15}/>{f('إضافة','Add')}
              </button>
              <button onClick={()=>setShowForm(false)} style={{ padding:'11px 20px', borderRadius:11, border:'1.5px solid #e0e3e9', background:'#fff', color:'#64748b', fontSize:14, fontWeight:700, cursor:'pointer' }}>{f('إلغاء','Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FEED VIEW ────────────────────────────────────────────────────────────────
function FeedView({ lang, f, rtl, roleStyle, feedPosts, onAddPost, onDeletePost, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', titleEn:'', body:'', bodyEn:'', type:'announcement', pinned:false });

  const TYPE_MAP = {
    announcement: { ar:'إعلان',      en:'Announcement', color:'#4F46E5', bg:'#ede9fe' },
    update:       { ar:'تحديث',       en:'Update',       color:'#10b981', bg:'#d1fae5' },
    alert:        { ar:'تنبيه',       en:'Alert',        color:'#ef4444', bg:'#fee2e2' },
    news:         { ar:'أخبار',       en:'News',         color:'#f59e0b', bg:'#fef3c7' },
  };

  const handleAdd = () => {
    if (!form.title && !form.titleEn) return;
    onAddPost({ ...form, id:'fp'+Date.now(), createdAt: new Date().toISOString(), authorId: currentUser.id, authorName: lang==='ar'?currentUser.name:currentUser.nameEn, authorAvatar: currentUser.avatar });
    setForm({ title:'', titleEn:'', body:'', bodyEn:'', type:'announcement', pinned:false });
    setShowForm(false);
  };

  const pinned = feedPosts.filter(p => p.pinned);
  const regular = feedPosts.filter(p => !p.pinned);

  return (
    <div dir={rtl?'rtl':'ltr'}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:10 }}>
          <Activity size={22} color={roleStyle.accent}/>{f('الإعلانات والتحديثات','Feed & Announcements')}
        </h1>
        {(currentUser.role === 'admin') && (
          <button onClick={()=>setShowForm(!showForm)} style={{ background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:`0 4px 14px ${roleStyle.accent}44` }}>
            <Plus size={15}/>{f('إضافة إعلان','New Post')}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ ...GLASS, borderRadius:20, padding:'1.5rem', marginBottom:'1.5rem', border:'1.5px solid #e2e8f0' }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:'1rem' }}>{f('إعلان جديد','New Announcement')}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={fLabel}>{f('العنوان (عربي)','Title (Arabic)')}</label>
              <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={fInput}/>
            </div>
            <div>
              <label style={fLabel}>{f('العنوان (إنجليزي)','Title (English)')}</label>
              <input value={form.titleEn} onChange={e=>setForm({...form,titleEn:e.target.value})} style={{...fInput,direction:'ltr'}}/>
            </div>
            <div>
              <label style={fLabel}>{f('النوع','Type')}</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={fSelect}>
                {Object.entries(TYPE_MAP).map(([k,v])=><option key={k} value={k}>{lang==='ar'?v.ar:v.en}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'flex-end' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:700, color:'#374151' }}>
                <input type="checkbox" checked={form.pinned} onChange={e=>setForm({...form,pinned:e.target.checked})} style={{ width:16, height:16, accentColor:roleStyle.accent }}/>
                {f('تثبيت في الأعلى','Pin to top')}
              </label>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={fLabel}>{f('المحتوى (عربي)','Body (Arabic)')}</label>
              <textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} rows={3} style={{...fInput,resize:'vertical',height:'auto'}}/>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={fLabel}>{f('المحتوى (إنجليزي)','Body (English)')}</label>
              <textarea value={form.bodyEn} onChange={e=>setForm({...form,bodyEn:e.target.value})} rows={3} style={{...fInput,direction:'ltr',resize:'vertical',height:'auto'}}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleAdd} disabled={!form.title&&!form.titleEn} style={{ background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'10px 24px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
              <Plus size={14}/>{f('نشر','Publish')}
            </button>
            <button onClick={()=>setShowForm(false)} style={{ padding:'10px 20px', borderRadius:11, border:'1.5px solid #e0e3e9', background:'#fff', color:'#64748b', fontSize:13, fontWeight:700, cursor:'pointer' }}>{f('إلغاء','Cancel')}</button>
          </div>
        </div>
      )}

      {feedPosts.length === 0 && (
        <div style={{ textAlign:'center', padding:'4rem', color:'#94a3b8' }}>
          <Activity size={48} style={{ opacity:.3, marginBottom:16 }}/>
          <p style={{ fontSize:15, fontWeight:700 }}>{f('لا توجد إعلانات حتى الآن','No posts yet')}</p>
        </div>
      )}

      {pinned.length > 0 && (
        <div style={{ marginBottom:'1rem' }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>{f('مثبت','Pinned')}</div>
          {pinned.map(post => <FeedCard key={post.id} post={post} lang={lang} f={f} typeMap={TYPE_MAP} onDelete={onDeletePost} currentUser={currentUser} roleStyle={roleStyle}/>)}
        </div>
      )}
      {regular.map(post => <FeedCard key={post.id} post={post} lang={lang} f={f} typeMap={TYPE_MAP} onDelete={onDeletePost} currentUser={currentUser} roleStyle={roleStyle}/>)}
    </div>
  );
}

function FeedCard({ post, lang, f, typeMap, onDelete, currentUser, roleStyle }) {
  const tm = typeMap[post.type] || typeMap.announcement;
  const title = lang==='ar' ? post.title : (post.titleEn || post.title);
  const body  = lang==='ar' ? post.body  : (post.bodyEn  || post.body);
  const dateStr = new Date(post.createdAt).toLocaleDateString(lang==='ar'?'ar-AE':'en-AE', { year:'numeric', month:'short', day:'numeric' });

  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid #e2e8f0', padding:'1.25rem', marginBottom:12, borderLeft:`4px solid ${tm.color}`, boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
            <span style={{ background:tm.bg, color:tm.color, fontSize:10, fontWeight:800, padding:'2px 9px', borderRadius:20 }}>{lang==='ar'?tm.ar:tm.en}</span>
            {post.pinned && <span style={{ background:'#fef3c7', color:'#92400e', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20 }}>📌 {f('مثبت','Pinned')}</span>}
            <span style={{ fontSize:11, color:'#94a3b8', marginInlineStart:'auto' }}>{dateStr}</span>
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{title}</div>
          {body && <div style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>{body}</div>}
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:8 }}>{f('بواسطة','By')} {post.authorName}</div>
        </div>
        {(currentUser.role === 'admin' || currentUser.id === post.authorId) && (
          <button onClick={()=>onDelete(post.id)} style={{ background:'#fff2f2', border:'1px solid #fecaca', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#dc2626', flexShrink:0 }}>
            <Trash2 size={13}/>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── TASKS VIEW ───────────────────────────────────────────────────────────────
function TasksView({ lang, f, rtl, roleStyle, tasks, onAddTask, onUpdateTask, onDeleteTask, users, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter]     = useState('all');
  const emptyForm = { title:'', titleEn:'', desc:'', priority:'medium', status:'todo', assigneeId:'', dueDate:'' };
  const [form, setForm] = useState(emptyForm);

  const PRIORITY = {
    high:   { ar:'عالية',  en:'High',   color:'#ef4444', bg:'#fee2e2' },
    medium: { ar:'متوسطة', en:'Medium', color:'#f59e0b', bg:'#fef3c7' },
    low:    { ar:'منخفضة', en:'Low',    color:'#10b981', bg:'#d1fae5' },
  };
  const STATUS = {
    todo:        { ar:'للتنفيذ',    en:'To Do',       color:'#64748b', bg:'#f1f5f9' },
    in_progress: { ar:'قيد التنفيذ', en:'In Progress', color:'#4F46E5', bg:'#ede9fe' },
    done:        { ar:'مكتمل',      en:'Done',         color:'#10b981', bg:'#d1fae5' },
  };

  const handleAdd = () => {
    if (!form.title && !form.titleEn) return;
    onAddTask({ ...form, id:'task'+Date.now(), createdAt: new Date().toISOString(), createdBy: currentUser.id });
    setForm(emptyForm);
    setShowForm(false);
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div dir={rtl?'rtl':'ltr'}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:10 }}>
          <CheckSquare size={22} color={roleStyle.accent}/>{f('إدارة المهام','Task Management')}
        </h1>
        <button onClick={()=>setShowForm(!showForm)} style={{ background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7, boxShadow:`0 4px 14px ${roleStyle.accent}44` }}>
          <Plus size={15}/>{f('مهمة جديدة','New Task')}
        </button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:'1rem', flexWrap:'wrap' }}>
        {[{v:'all',ar:'الكل',en:'All'}, ...Object.entries(STATUS).map(([k,v])=>({v:k,ar:v.ar,en:v.en}))].map(opt => (
          <button key={opt.v} onClick={()=>setFilter(opt.v)} style={{ padding:'7px 16px', borderRadius:10, border:`1.5px solid ${filter===opt.v?roleStyle.accent:'#e2e8f0'}`, background:filter===opt.v?roleStyle.accent:'#fff', color:filter===opt.v?'#fff':'#64748b', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            {lang==='ar'?opt.ar:opt.en}
            {opt.v !== 'all' && <span style={{ marginInlineStart:6, background:filter===opt.v?'rgba(255,255,255,0.25)':(STATUS[opt.v]?.bg||'#f1f5f9'), color:filter===opt.v?'#fff':(STATUS[opt.v]?.color||'#64748b'), borderRadius:20, padding:'0 6px', fontSize:10, fontWeight:900 }}>{tasks.filter(t=>t.status===opt.v).length}</span>}
          </button>
        ))}
      </div>

      {showForm && (
        <div style={{ background:'#fff', borderRadius:18, border:'1.5px solid #e2e8f0', padding:'1.5rem', marginBottom:'1rem', boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={fLabel}>{f('العنوان (عربي)','Title (Arabic)')}</label>
              <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={fInput}/>
            </div>
            <div>
              <label style={fLabel}>{f('العنوان (إنجليزي)','Title (English)')}</label>
              <input value={form.titleEn} onChange={e=>setForm({...form,titleEn:e.target.value})} style={{...fInput,direction:'ltr'}}/>
            </div>
            <div>
              <label style={fLabel}>{f('الأولوية','Priority')}</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} style={fSelect}>
                {Object.entries(PRIORITY).map(([k,v])=><option key={k} value={k}>{lang==='ar'?v.ar:v.en}</option>)}
              </select>
            </div>
            <div>
              <label style={fLabel}>{f('تاريخ الاستحقاق','Due Date')}</label>
              <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} style={{...fInput,direction:'ltr'}}/>
            </div>
            <div>
              <label style={fLabel}>{f('تعيين لـ','Assign to')}</label>
              <select value={form.assigneeId} onChange={e=>setForm({...form,assigneeId:e.target.value})} style={fSelect}>
                <option value="">{f('غير مسند','Unassigned')}</option>
                {users.map(u=><option key={u.id} value={u.id}>{lang==='ar'?u.name:u.nameEn}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={fLabel}>{f('الوصف','Description')}</label>
              <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} style={{...fInput,resize:'vertical',height:'auto'}}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:12 }}>
            <button onClick={handleAdd} disabled={!form.title&&!form.titleEn} style={{ background:`linear-gradient(135deg,${roleStyle.accent},${roleStyle.accent}cc)`, color:'#fff', border:'none', borderRadius:11, padding:'10px 24px', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
              <Plus size={14}/>{f('إضافة','Add Task')}
            </button>
            <button onClick={()=>setShowForm(false)} style={{ padding:'10px 20px', borderRadius:11, border:'1.5px solid #e0e3e9', background:'#fff', color:'#64748b', fontSize:13, fontWeight:700, cursor:'pointer' }}>{f('إلغاء','Cancel')}</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
          <CheckSquare size={40} style={{ opacity:.3, marginBottom:12 }}/>
          <p style={{ fontSize:14, fontWeight:700 }}>{f('لا توجد مهام','No tasks found')}</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(task => {
          const pr = PRIORITY[task.priority] || PRIORITY.medium;
          const st = STATUS[task.status] || STATUS.todo;
          const assignee = users.find(u => u.id === task.assigneeId);
          const title = lang==='ar' ? task.title : (task.titleEn || task.title);
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
          return (
            <div key={task.id} style={{ background:'#fff', borderRadius:14, border:'1.5px solid #e2e8f0', padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:14, boxShadow:'0 2px 8px rgba(0,0,0,0.05)', borderLeft:`4px solid ${pr.color}` }}>
              <input type="checkbox" checked={task.status==='done'} onChange={e=>onUpdateTask(task.id,{status:e.target.checked?'done':'todo'})} style={{ width:18, height:18, accentColor:roleStyle.accent, cursor:'pointer', flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color: task.status==='done'?'#94a3b8':'#0f172a', textDecoration: task.status==='done'?'line-through':'none', marginBottom:4 }}>{title}</div>
                {task.desc && <div style={{ fontSize:12, color:'#64748b', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.desc}</div>}
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ background:pr.bg, color:pr.color, fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20 }}>{lang==='ar'?pr.ar:pr.en}</span>
                  <span style={{ background:st.bg, color:st.color, fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20 }}>{lang==='ar'?st.ar:st.en}</span>
                  {task.dueDate && <span style={{ fontSize:11, color: isOverdue?'#ef4444':'#94a3b8', fontWeight:600 }}>{f('الاستحقاق:','Due:')} {task.dueDate}</span>}
                  {assignee && <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{lang==='ar'?assignee.name:assignee.nameEn}</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <select value={task.status} onChange={e=>onUpdateTask(task.id,{status:e.target.value})} style={{ fontSize:11, padding:'4px 8px', borderRadius:8, border:'1.5px solid #e2e8f0', cursor:'pointer', background:'#f8fafc', color:'#475569', fontWeight:700 }}>
                  {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{lang==='ar'?v.ar:v.en}</option>)}
                </select>
                <button onClick={()=>onDeleteTask(task.id)} style={{ background:'#fff2f2', border:'1px solid #fecaca', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#dc2626' }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TEAM CHAT VIEW ───────────────────────────────────────────────────────────
function TeamChatView({ lang, f, rtl, roleStyle, messages, onAddMessage, onDeleteMessage, groups, onAddGroup, onDeleteGroup, currentUser, users }) {
  const [input,      setInput]      = useState('');
  const [thread,     setThread]     = useState(null); // null = no selection
  const [hoverId,    setHoverId]    = useState(null);
  const [showNewGrp, setShowNewGrp] = useState(false);
  const [grpForm,    setGrpForm]    = useState({ name:'', members:[] });
  const msgEndRef = useRef(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, thread]);

  // Determine visible groups: all groups where current user is a member (or admin sees all)
  const myGroups = groups.filter(g =>
    currentUser.role === 'admin' || (g.members || []).includes(currentUser.id)
  );

  const threadMsgs = !thread ? [] :
    thread.type === 'group'
      ? messages.filter(m => m.groupId === thread.id)
      : messages.filter(m => m.type === 'dm' && (
          (m.senderId === currentUser.id && m.dmTo === thread.id) ||
          (m.senderId === thread.id && m.dmTo === currentUser.id)
        ));

  const sendMsg = () => {
    if (!input.trim() || !thread) return;
    const base = {
      id: 'msg'+Date.now(), text:input.trim(),
      senderId: currentUser.id,
      senderName: lang==='ar' ? currentUser.name : currentUser.nameEn,
      senderAvatar: currentUser.avatar,
      createdAt: new Date().toISOString(),
    };
    onAddMessage(thread.type === 'group'
      ? { ...base, groupId: thread.id }
      : { ...base, type:'dm', dmTo: thread.id }
    );
    setInput('');
  };

  const grpCount  = (gid) => messages.filter(m => m.groupId === gid).length;
  const dmCount   = (uid) => messages.filter(m => m.type==='dm' && ((m.senderId===currentUser.id&&m.dmTo===uid)||(m.senderId===uid&&m.dmTo===currentUser.id))).length;
  const otherUsers = users.filter(u => u.id !== currentUser.id);

  const createGroup = () => {
    if (!grpForm.name.trim()) return;
    const g = { id:'grp'+Date.now(), name:grpForm.name.trim(), members:[currentUser.id, ...grpForm.members], createdBy:currentUser.id, createdAt:new Date().toISOString() };
    onAddGroup(g);
    setThread({ type:'group', id:g.id, label:g.name });
    setGrpForm({ name:'', members:[] });
    setShowNewGrp(false);
  };

  const threadHeader = !thread ? null :
    thread.type === 'group'
      ? { icon:<Users size={15}/>, name:thread.label, sub: `${(groups.find(g=>g.id===thread.id)?.members||[]).length} ${f('أعضاء','members')}` }
      : { icon:<div style={{ width:30,height:30,borderRadius:'50%',background:`${PRIMARY}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:PRIMARY }}>{users.find(u=>u.id===thread.id)?.avatar||'?'}</div>, name:lang==='ar'?thread.label:thread.labelEn, sub:f('متصل','Online') };

  return (
    <div dir={rtl?'rtl':'ltr'} className="makan-chat-wrapper" style={{ display:'flex', gap:0, height:'calc(100vh - 160px)', minHeight:500, background:'#fff', borderRadius:20, border:'1.5px solid #e2e8f0', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>

      {/* ── Left sidebar ── */}
      <div className="makan-chat-sidebar" style={{ width:230, flexShrink:0, borderInlineEnd:'1px solid #f1f5f9', display:'flex', flexDirection:'column', background:'#fafafa' }}>

        {/* Groups section header */}
        <div style={{ padding:'14px 12px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1.2 }}>{f('المجموعات','Groups')}</span>
          <button onClick={()=>setShowNewGrp(true)} title={f('مجموعة جديدة','New Group')}
            style={{ width:22,height:22,borderRadius:7,background:`${PRIMARY}`,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff' }}>
            <Plus size={13}/>
          </button>
        </div>

        {/* Groups list */}
        <div style={{ padding:'0 8px', marginBottom:4 }}>
          {myGroups.length === 0 ? (
            <div style={{ padding:'10px 10px',fontSize:11,color:'#cbd5e1',textAlign:'center' }}>{f('لا توجد مجموعات بعد','No groups yet')}</div>
          ) : myGroups.map(g => {
            const active = thread?.type==='group' && thread?.id===g.id;
            const cnt = grpCount(g.id);
            return (
              <button key={g.id} onClick={()=>setThread({type:'group',id:g.id,label:g.name})}
                style={{ width:'100%',padding:'9px 10px',borderRadius:10,border:'none',background:active?`${PRIMARY}12`:'transparent',color:active?PRIMARY:'#475569',fontSize:13,fontWeight:active?800:600,cursor:'pointer',textAlign:'start',display:'flex',alignItems:'center',gap:8,marginBottom:2,transition:'all .12s' }}>
                <div style={{ width:26,height:26,borderRadius:8,background:active?`${PRIMARY}22`:'#e2e8f0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <Users size={13} color={active?PRIMARY:'#94a3b8'}/>
                </div>
                <span style={{ flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{g.name}</span>
                {cnt>0&&<span style={{ background:active?PRIMARY:PRIMARY+'22',color:active?'#fff':PRIMARY,borderRadius:20,padding:'1px 7px',fontSize:10,fontWeight:900 }}>{cnt}</span>}
              </button>
            );
          })}
        </div>

        {/* DMs section */}
        <div style={{ padding:'10px 12px 6px', borderTop:'1px solid #f1f5f9', fontSize:10,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1.2 }}>
          {f('رسائل مباشرة','Direct Messages')}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'0 8px 8px' }}>
          {otherUsers.map(u => {
            const active = thread?.type==='dm' && thread?.id===u.id;
            const cnt = dmCount(u.id);
            return (
              <button key={u.id} onClick={()=>setThread({type:'dm',id:u.id,label:u.name,labelEn:u.nameEn})}
                style={{ width:'100%',padding:'9px 10px',borderRadius:10,border:'none',background:active?`${PRIMARY}12`:'transparent',color:active?PRIMARY:'#475569',fontSize:13,fontWeight:active?800:600,cursor:'pointer',textAlign:'start',display:'flex',alignItems:'center',gap:8,marginBottom:2,transition:'all .12s' }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:`${PRIMARY}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:PRIMARY,flexShrink:0 }}>{u.avatar}</div>
                <span style={{ flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{lang==='ar'?u.name:u.nameEn}</span>
                <div style={{ width:7,height:7,borderRadius:'50%',background:'#10b981',flexShrink:0 }}/>
                {cnt>0&&<span style={{ background:PRIMARY+'22',color:PRIMARY,borderRadius:20,padding:'1px 7px',fontSize:10,fontWeight:900 }}>{cnt}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main chat area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!thread ? (
          <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,color:'#94a3b8' }}>
            <MessageSquare size={52} style={{ opacity:.2 }}/>
            <p style={{ fontSize:15,fontWeight:700,margin:0 }}>{f('اختر مجموعة أو شخصاً للبدء','Select a group or person to start')}</p>
            <button onClick={()=>setShowNewGrp(true)} style={{ background:`linear-gradient(135deg,${PRIMARY},${PRIMARY}cc)`,color:'#fff',border:'none',borderRadius:11,padding:'10px 22px',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:7,boxShadow:`0 4px 14px ${PRIMARY}44` }}>
              <Plus size={15}/>{f('إنشاء مجموعة جديدة','Create New Group')}
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding:'12px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:10,background:'#fff' }}>
              {typeof threadHeader.icon === 'string' ? threadHeader.icon : threadHeader.icon}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15,fontWeight:800,color:'#0f172a' }}>{threadHeader.name}</div>
                <div style={{ fontSize:11,color:'#10b981',fontWeight:600 }}>{threadHeader.sub}</div>
              </div>
              {thread.type==='group' && currentUser.role==='admin'||user.role==='superadmin' && (
                <button onClick={()=>{if(window.confirm(f(`حذف مجموعة "${thread.label}"؟`,`Delete group "${thread.label}"?`))){onDeleteGroup(thread.id);setThread(null);}}} style={{ background:'#fff2f2',border:'1px solid #fecaca',borderRadius:8,padding:'5px 8px',cursor:'pointer',color:'#dc2626',display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700 }}>
                  <Trash2 size={12}/>{f('حذف','Delete')}
                </button>
              )}
              <span style={{ fontSize:11,color:'#94a3b8' }}>{threadMsgs.length} {f('رسالة','msg')}</span>
            </div>

            {/* Messages */}
            <div style={{ flex:1,overflowY:'auto',padding:'1rem',display:'flex',flexDirection:'column',gap:10 }}>
              {threadMsgs.length === 0 && (
                <div style={{ textAlign:'center',padding:'3rem',color:'#94a3b8' }}>
                  <MessageSquare size={40} style={{ opacity:.2,marginBottom:12 }}/>
                  <p style={{ fontSize:13,fontWeight:700 }}>{f('لا توجد رسائل بعد — ابدأ المحادثة!','No messages yet — say hi!')}</p>
                </div>
              )}
              {threadMsgs.map(msg => {
                const isMe = msg.senderId === currentUser.id;
                const time = new Date(msg.createdAt).toLocaleTimeString(lang==='ar'?'ar-AE':'en-AE',{hour:'2-digit',minute:'2-digit'});
                return (
                  <div key={msg.id} onMouseEnter={()=>setHoverId(msg.id)} onMouseLeave={()=>setHoverId(null)}
                    style={{ display:'flex',flexDirection:isMe?'row-reverse':'row',gap:8,alignItems:'flex-end' }}>
                    <div style={{ width:32,height:32,borderRadius:'50%',background:`${PRIMARY}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:PRIMARY,flexShrink:0 }}>{msg.senderAvatar}</div>
                    <div style={{ maxWidth:'68%' }}>
                      {!isMe && <div style={{ fontSize:11,color:'#94a3b8',marginBottom:3,fontWeight:700 }}>{msg.senderName}</div>}
                      <div style={{ display:'flex',alignItems:'flex-end',gap:6,flexDirection:isMe?'row-reverse':'row' }}>
                        <div style={{ background:isMe?PRIMARY:'#f1f5f9',color:isMe?'#fff':'#0f172a',borderRadius:isMe?'18px 18px 4px 18px':'18px 18px 18px 4px',padding:'10px 14px',fontSize:13,lineHeight:1.5,wordBreak:'break-word' }}>
                          {msg.text}
                        </div>
                        {isMe && hoverId===msg.id && (
                          <button onClick={()=>onDeleteMessage(msg.id)} style={{ background:'#fff2f2',border:'1px solid #fecaca',borderRadius:7,padding:'4px 6px',cursor:'pointer',color:'#dc2626',display:'flex',alignItems:'center',flexShrink:0 }}>
                            <Trash2 size={11}/>
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize:10,color:'#94a3b8',marginTop:3,textAlign:isMe?'end':'start' }}>{time}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEndRef}/>
            </div>

            {/* Input */}
            <div className="makan-chat-input-bar" style={{ padding:'10px 14px',borderTop:'1px solid #f1f5f9',display:'flex',gap:8,alignItems:'center',background:'#fff' }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMsg()}
                placeholder={thread.type==='group'
                  ? f(`اكتب في ${thread.label}...`,`Message ${thread.label}...`)
                  : f(`رسالة لـ ${lang==='ar'?thread.label:thread.labelEn}...`,`Message ${thread.labelEn||thread.label}...`)}
                style={{ ...fInput,flex:1,marginBottom:0,borderRadius:22,paddingInline:'14px' }}
                autoFocus
              />
              <button onClick={sendMsg} disabled={!input.trim()}
                style={{ background:input.trim()?`linear-gradient(135deg,${PRIMARY},${PRIMARY}cc)`:'#e2e8f0',color:input.trim()?'#fff':'#94a3b8',border:'none',borderRadius:'50%',width:42,height:42,display:'flex',alignItems:'center',justifyContent:'center',cursor:input.trim()?'pointer':'not-allowed',flexShrink:0,boxShadow:input.trim()?`0 4px 14px ${PRIMARY}44`:undefined }}>
                <Send size={17}/>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── New Group Modal ── */}
      {showNewGrp && (
        <div onClick={()=>setShowNewGrp(false)} style={{ position:'fixed',inset:0,background:'rgba(10,14,30,0.75)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem' }}>
          <div onClick={e=>e.stopPropagation()} className="makan-modal" style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:440,padding:'1.75rem',boxShadow:'0 24px 80px rgba(10,14,30,0.35)',fontFamily:"'Tajawal','Segoe UI',sans-serif" }}>
            <h3 style={{ fontSize:17,fontWeight:900,color:'#0f172a',marginBottom:'1.25rem',display:'flex',alignItems:'center',gap:8 }}>
              <Users size={17} color={PRIMARY}/>{f('إنشاء مجموعة جديدة','Create New Group')}
            </h3>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div>
                <label style={fLabel}>{f('اسم المجموعة *','Group Name *')}</label>
                <input value={grpForm.name} onChange={e=>setGrpForm({...grpForm,name:e.target.value})} style={fInput} placeholder={f('مثال: فريق المبيعات','e.g. Sales Team')} autoFocus/>
              </div>
              <div>
                <label style={fLabel}>{f('إضافة أعضاء','Add Members')}</label>
                <div style={{ display:'flex',flexDirection:'column',gap:6,maxHeight:220,overflowY:'auto',padding:'4px 0' }}>
                  {otherUsers.map(u => {
                    const checked = grpForm.members.includes(u.id);
                    return (
                      <label key={u.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:11,background:checked?`${PRIMARY}08`:'#f8fafc',cursor:'pointer',border:`1.5px solid ${checked?`${PRIMARY}30`:'transparent'}`,transition:'all .12s' }}>
                        <input type="checkbox" checked={checked} onChange={e=>setGrpForm({...grpForm,members:e.target.checked?[...grpForm.members,u.id]:grpForm.members.filter(id=>id!==u.id)})} style={{ width:16,height:16,accentColor:PRIMARY,flexShrink:0 }}/>
                        <div style={{ width:30,height:30,borderRadius:'50%',background:`${PRIMARY}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:PRIMARY,flexShrink:0 }}>{u.avatar}</div>
                        <div>
                          <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>{lang==='ar'?u.name:u.nameEn}</div>
                          <div style={{ fontSize:10,color:'#94a3b8' }}>{u.role}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ display:'flex',gap:10,marginTop:18 }}>
              <button onClick={createGroup} disabled={!grpForm.name.trim()}
                style={{ flex:1,background:grpForm.name.trim()?`linear-gradient(135deg,${PRIMARY},${PRIMARY}cc)`:'#e2e8f0',color:grpForm.name.trim()?'#fff':'#94a3b8',border:'none',borderRadius:11,padding:'12px',fontSize:14,fontWeight:700,cursor:grpForm.name.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                <Users size={15}/>{f('إنشاء المجموعة','Create Group')}
              </button>
              <button onClick={()=>setShowNewGrp(false)} style={{ padding:'12px 20px',borderRadius:11,border:'1.5px solid #e0e3e9',background:'#fff',color:'#64748b',fontSize:14,fontWeight:700,cursor:'pointer' }}>{f('إلغاء','Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── PROFILE VIEW ─────────────────────────────────────────────────────────────
function ProfileView({ lang, f, rtl, roleStyle, currentUser, users, onUpdateProfile }) {
  const [viewingId,  setViewingId]  = useState(currentUser.id);
  const [editing,    setEditing]    = useState(false);
  const [saved,      setSaved]      = useState(false);
  const fileRef = useRef(null);

  const me = viewingId === currentUser.id;
  const profileUser = users.find(u => u.id === viewingId) || currentUser;

  const emptyForm = {
    name:       profileUser.name       || '',
    nameEn:     profileUser.nameEn     || '',
    jobTitle:   profileUser.jobTitle   || '',
    phone:      profileUser.phone      || '',
    bio:        profileUser.bio        || '',
    location:   profileUser.location   || '',
    linkedin:   profileUser.linkedin   || '',
    customFields: profileUser.customFields || [],
    photoUrl:   profileUser.photoUrl   || '',
  };
  const [form, setForm] = useState(emptyForm);

  // Sync form when viewing different user
  useEffect(() => {
    const u = users.find(u=>u.id===viewingId)||currentUser;
    setForm({ name:u.name||'', nameEn:u.nameEn||'', jobTitle:u.jobTitle||'', phone:u.phone||'', bio:u.bio||'', location:u.location||'', linkedin:u.linkedin||'', customFields:u.customFields||[], photoUrl:u.photoUrl||'' });
    setEditing(false);
  }, [viewingId]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({...p, photoUrl: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onUpdateProfile(currentUser.id, { ...form, avatar: (form.nameEn||form.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) });
    setSaved(true);
    setEditing(false);
    setTimeout(()=>setSaved(false), 2500);
  };

  const addCustomField = () => setForm(p=>({...p, customFields:[...p.customFields,{label:'',value:''}]}));
  const updateField = (i, key, val) => setForm(p=>({...p, customFields:p.customFields.map((f,fi)=>fi===i?{...f,[key]:val}:f)}));
  const removeField = (i) => setForm(p=>({...p, customFields:p.customFields.filter((_,fi)=>fi!==i)}));

  const teamMembers = users.filter(u=>u.id!==currentUser.id);

  const ROLE_LABELS = { admin:f('مدير النظام','System Admin'), listing:f('فريق الليسنج','Listings Team'), sales:f('فريق المبيعات','Sales Team') };

  return (
    <div dir={rtl?'rtl':'ltr'} style={{ maxWidth:900, margin:'0 auto' }}>
      {/* Team members strip */}
      {teamMembers.length > 0 && (
        <div style={{ display:'flex', gap:10, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
          {/* My profile pill */}
          <button onClick={()=>setViewingId(currentUser.id)} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:30,border:`2px solid ${viewingId===currentUser.id?PRIMARY:'rgba(226,232,240,0.8)'}`,background:viewingId===currentUser.id?`${PRIMARY}10`:'#fff',cursor:'pointer',flexShrink:0,transition:'all .12s' }}>
            {currentUser.photoUrl ? <img src={currentUser.photoUrl} alt="" style={{ width:26,height:26,borderRadius:'50%',objectFit:'cover' }}/> : <div style={{ width:26,height:26,borderRadius:'50%',background:`${PRIMARY}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:PRIMARY }}>{currentUser.avatar}</div>}
            <span style={{ fontSize:12,fontWeight:700,color:viewingId===currentUser.id?PRIMARY:'#374151',whiteSpace:'nowrap' }}>{f('بروفايلي','My Profile')}</span>
          </button>
          {teamMembers.map(u=>(
            <button key={u.id} onClick={()=>setViewingId(u.id)} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:30,border:`2px solid ${viewingId===u.id?PRIMARY:'rgba(226,232,240,0.8)'}`,background:viewingId===u.id?`${PRIMARY}10`:'#fff',cursor:'pointer',flexShrink:0,transition:'all .12s' }}>
              {u.photoUrl ? <img src={u.photoUrl} alt="" style={{ width:26,height:26,borderRadius:'50%',objectFit:'cover' }}/> : <div style={{ width:26,height:26,borderRadius:'50%',background:`${PRIMARY}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:PRIMARY }}>{u.avatar}</div>}
              <span style={{ fontSize:12,fontWeight:700,color:viewingId===u.id?PRIMARY:'#374151',whiteSpace:'nowrap' }}>{lang==='ar'?u.name:u.nameEn}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main profile card */}
      <div style={{ ...GLASS, borderRadius:24, overflow:'hidden', boxShadow:'0 8px 40px rgba(79,70,229,0.10)' }}>
        {/* Cover banner */}
        <div style={{ height:120, background:`linear-gradient(135deg,${PRIMARY},#7c3aed,#0ea5e9)`, position:'relative' }}>
          <div style={{ position:'absolute',inset:0,opacity:.15,backgroundImage:'radial-gradient(circle at 20% 50%,#fff 1px,transparent 1px),radial-gradient(circle at 80% 50%,#fff 1px,transparent 1px)',backgroundSize:'30px 30px' }}/>
        </div>

        <div style={{ padding:'0 2rem 2rem', position:'relative' }}>
          {/* Avatar */}
          <div style={{ position:'relative', display:'inline-block', marginTop:-50, marginBottom:12 }}>
            {(me&&editing?form.photoUrl:profileUser.photoUrl)
              ? <img src={me&&editing?form.photoUrl:profileUser.photoUrl} alt="" style={{ width:96,height:96,borderRadius:'50%',objectFit:'cover',border:'4px solid #fff',boxShadow:`0 4px 16px ${PRIMARY}44` }}/>
              : <div style={{ width:96,height:96,borderRadius:'50%',background:`linear-gradient(135deg,${PRIMARY},#7c3aed)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:32,fontWeight:900,border:'4px solid #fff',boxShadow:`0 4px 16px ${PRIMARY}44` }}>{profileUser.avatar||'?'}</div>
            }
            {me && editing && (
              <>
                <button onClick={()=>fileRef.current?.click()} style={{ position:'absolute',bottom:2,right:2,width:28,height:28,borderRadius:'50%',background:PRIMARY,border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
                  <Camera size={13} color="#fff"/>
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }}/>
              </>
            )}
          </div>

          {/* Edit button row */}
          <div style={{ position:'absolute', top:16, right:rtl?'auto':'2rem', left:rtl?'2rem':'auto', display:'flex', gap:8 }}>
            {me && !editing && (
              <button onClick={()=>setEditing(true)} style={{ background:'#fff',border:`1.5px solid ${PRIMARY}`,borderRadius:10,padding:'7px 16px',fontSize:12,fontWeight:700,color:PRIMARY,cursor:'pointer',display:'flex',alignItems:'center',gap:6 }}>
                <Settings size={13}/>{f('تعديل البروفايل','Edit Profile')}
              </button>
            )}
            {me && editing && (
              <>
                <button onClick={handleSave} style={{ background:PRIMARY,border:'none',borderRadius:10,padding:'7px 16px',fontSize:12,fontWeight:700,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:6,boxShadow:`0 4px 12px ${PRIMARY}55` }}>
                  <Check size={13}/>{f('حفظ','Save')}
                </button>
                <button onClick={()=>{setEditing(false);setForm(emptyForm);}} style={{ background:'#fff',border:'1.5px solid #e2e8f0',borderRadius:10,padding:'7px 16px',fontSize:12,fontWeight:700,color:'#64748b',cursor:'pointer' }}>
                  {f('إلغاء','Cancel')}
                </button>
              </>
            )}
            {saved && <div style={{ background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'7px 14px',fontSize:12,fontWeight:700,color:'#16a34a',display:'flex',alignItems:'center',gap:5 }}><Check size={13}/>{f('تم الحفظ!','Saved!')}</div>}
          </div>

          {/* Name & title */}
          {me && editing ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div><label style={fLabel}>{f('الاسم بالعربي','Name (Arabic)')}</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={fInput}/></div>
              <div><label style={fLabel}>{f('الاسم بالإنجليزي','Name (English)')}</label><input value={form.nameEn} onChange={e=>setForm({...form,nameEn:e.target.value})} style={{...fInput,direction:'ltr'}}/></div>
              <div><label style={fLabel}>{f('المسمى الوظيفي','Job Title')}</label><input value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})} style={fInput} placeholder={f('مثال: مدير المبيعات','e.g. Sales Manager')}/></div>
              <div><label style={fLabel}>{f('الموقع','Location')}</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} style={fInput} placeholder={f('المدينة أو الدولة','City or Country')}/></div>
            </div>
          ) : (
            <div style={{ marginBottom:12 }}>
              <h2 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:'0 0 4px' }}>{lang==='ar'?profileUser.name:profileUser.nameEn}</h2>
              {(profileUser.jobTitle) && <div style={{ fontSize:14, color:PRIMARY, fontWeight:700, marginBottom:4 }}>{profileUser.jobTitle}</div>}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ background:`${PRIMARY}10`, color:PRIMARY, borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{ROLE_LABELS[profileUser.role]||profileUser.role}</span>
                {profileUser.location && <span style={{ fontSize:12, color:'#64748b', display:'flex', alignItems:'center', gap:4 }}>📍 {profileUser.location}</span>}
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:8 }}>
            {/* Left col — bio + custom */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Bio */}
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{f('نبذة','About')}</div>
                {me && editing
                  ? <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} rows={4} style={{...fInput,resize:'vertical',minHeight:90}} placeholder={f('اكتب نبذة عن نفسك...','Write something about yourself...')}/>
                  : <p style={{ fontSize:13, color:'#475569', lineHeight:1.7, margin:0 }}>{profileUser.bio || <span style={{ color:'#cbd5e1', fontStyle:'italic' }}>{me?f('أضف نبذة عن نفسك','Add a bio'):'—'}</span>}</p>
                }
              </div>

              {/* Custom fields */}
              {(me && editing ? form.customFields : profileUser.customFields||[]).length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{f('تفاصيل إضافية','Details')}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {(me&&editing?form.customFields:profileUser.customFields||[]).map((cf, i) => (
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {me && editing ? (
                          <>
                            <input value={cf.label} onChange={e=>updateField(i,'label',e.target.value)} style={{...fInput,flex:'0 0 120px',padding:'6px 9px',fontSize:11}} placeholder={f('العنوان','Label')}/>
                            <input value={cf.value} onChange={e=>updateField(i,'value',e.target.value)} style={{...fInput,flex:1,padding:'6px 9px',fontSize:11}} placeholder={f('القيمة','Value')}/>
                            <button onClick={()=>removeField(i)} style={{ background:'transparent',border:'none',cursor:'pointer',color:'#94a3b8',padding:'3px' }}><X size={13}/></button>
                          </>
                        ) : (
                          <div style={{ display:'flex', gap:10, padding:'7px 12px', background:'#f8fafc', borderRadius:9, flex:1 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', minWidth:80 }}>{cf.label}</span>
                            <span style={{ fontSize:12, color:'#0f172a', fontWeight:600 }}>{cf.value}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {me && editing && (
                <button onClick={addCustomField} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:`1.5px dashed ${PRIMARY}44`,background:`${PRIMARY}05`,color:PRIMARY,fontSize:12,fontWeight:700,cursor:'pointer',alignSelf:'flex-start' }}>
                  <Plus size={13}/>{f('إضافة تفصيل','Add detail')}
                </button>
              )}
            </div>

            {/* Right col — contact info */}
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{f('معلومات التواصل','Contact Info')}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {me && editing ? (
                  <>
                    <div><label style={fLabel}>{f('رقم الهاتف','Phone')}</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={{...fInput,direction:'ltr'}} placeholder="+971..."/></div>
                    <div><label style={fLabel}>{f('البريد الإلكتروني','Email')}</label><input value={currentUser.email} disabled style={{...fInput,opacity:.6,cursor:'not-allowed',direction:'ltr'}}/></div>
                    <div><label style={fLabel}>LinkedIn</label><input value={form.linkedin} onChange={e=>setForm({...form,linkedin:e.target.value})} style={{...fInput,direction:'ltr'}} placeholder="https://linkedin.com/in/..."/></div>
                  </>
                ) : (
                  <>
                    {profileUser.phone && (
                      <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#fff',borderRadius:12,border:'1.5px solid #f1f5f9' }}>
                        <div style={{ width:32,height:32,borderRadius:'50%',background:'#f0fdf4',display:'flex',alignItems:'center',justifyContent:'center' }}><Phone size={14} color="#16a34a"/></div>
                        <div><div style={{ fontSize:10,color:'#94a3b8',fontWeight:700 }}>{f('الهاتف','Phone')}</div><div style={{ fontSize:13,fontWeight:700,direction:'ltr' }}>{profileUser.phone}</div></div>
                      </div>
                    )}
                    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#fff',borderRadius:12,border:'1.5px solid #f1f5f9' }}>
                      <div style={{ width:32,height:32,borderRadius:'50%',background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center' }}><Mail size={14} color="#3b82f6"/></div>
                      <div><div style={{ fontSize:10,color:'#94a3b8',fontWeight:700 }}>{f('البريد','Email')}</div><div style={{ fontSize:13,fontWeight:700,direction:'ltr' }}>{profileUser.email}</div></div>
                    </div>
                    {profileUser.linkedin && (
                      <a href={profileUser.linkedin} target="_blank" rel="noopener noreferrer" style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#fff',borderRadius:12,border:'1.5px solid #f1f5f9',textDecoration:'none' }}>
                        <div style={{ width:32,height:32,borderRadius:'50%',background:'#f0f9ff',display:'flex',alignItems:'center',justifyContent:'center' }}><ExternalLink size={14} color="#0284c7"/></div>
                        <div><div style={{ fontSize:10,color:'#94a3b8',fontWeight:700 }}>LinkedIn</div><div style={{ fontSize:12,fontWeight:700,color:'#0284c7',direction:'ltr',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:150 }}>{profileUser.linkedin.replace('https://linkedin.com/in/','').replace('https://www.linkedin.com/in/','')}</div></div>
                      </a>
                    )}
                    {!profileUser.phone && !profileUser.linkedin && !me && (
                      <div style={{ fontSize:13,color:'#cbd5e1',fontStyle:'italic',padding:'1rem 0' }}>—</div>
                    )}
                    {!profileUser.phone && !profileUser.linkedin && me && !editing && (
                      <button onClick={()=>setEditing(true)} style={{ display:'flex',alignItems:'center',gap:6,padding:'10px 14px',borderRadius:12,border:`1.5px dashed ${PRIMARY}33`,background:`${PRIMARY}05`,color:PRIMARY,fontSize:12,fontWeight:700,cursor:'pointer' }}>
                        <Plus size={13}/>{f('أضف معلومات تواصل','Add contact info')}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ACADEMY VIEW ─────────────────────────────────────────────────────────────
function AcademyView({ lang, f, rtl, roleStyle }) {
  const [activeModule, setActiveModule] = useState('intro');
  const [quizAnswers, setQuizAnswers]   = useState({});
  const [quizDone, setQuizDone]         = useState(false);
  const [scenarioType, setScenarioType] = useState('');
  const [scenario, setScenario]         = useState('');
  const [progress, setProgress]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('makan_academy_progress')||'[]'); } catch { return []; }
  });

  const markDone = (id) => {
    const next = progress.includes(id) ? progress : [...progress, id];
    setProgress(next);
    localStorage.setItem('makan_academy_progress', JSON.stringify(next));
  };

  const MODULES = [
    { id:'intro', icon:'📖', ar:'المقدمة',               en:'Introduction' },
    { id:'m1',    icon:'🏘️', ar:'١. أنواع العقارات',     en:'1. Property Types' },
    { id:'m2',    icon:'📋', ar:'٢. المصطلحات الرئيسية', en:'2. Key Terms' },
    { id:'m3',    icon:'🤝', ar:'٣. عمليات البيع',       en:'3. Sales Operations' },
    { id:'m4',    icon:'⚖️', ar:'٤. الدفع والقانون',     en:'4. Payment & Law' },
    { id:'m5',    icon:'🏦', ar:'٥. الرهن العقاري',      en:'5. Mortgage' },
    { id:'m6',    icon:'📈', ar:'٦. استراتيجيات الاستثمار', en:'6. Investment Strategy' },
    { id:'m7',    icon:'👥', ar:'٧. تصنيف العملاء',      en:'7. Client Types' },
    { id:'m8',    icon:'💬', ar:'٨. التعامل مع العملاء', en:'8. Client Handling' },
    { id:'m9',    icon:'✅', ar:'٩. قوائم المراجعة',     en:'9. Checklists' },
    { id:'m10',   icon:'📄', ar:'١٠. إجراءات NOC',       en:'10. NOC Procedures' },
    { id:'m11',   icon:'🎯', ar:'١١. آداب العرض',        en:'11. Listing Ethics' },
    { id:'m12',   icon:'🧪', ar:'١٢. اختبار المعرفة',    en:'12. Knowledge Test' },
    { id:'sim',   icon:'✨', ar:'محاكي السيناريوهات',    en:'Scenario Simulator' },
  ];

  const QUIZ = [
    { id:'q1', ar:'ما هي رسوم بلدية أبوظبي (ADM) القياسية؟', en:'What is the standard Abu Dhabi Municipality (ADM) fee?',
      options:[{ar:'5%',en:'5%'},{ar:'2%',en:'2%'},{ar:'10%',en:'10%'}], answer:1 },
    { id:'q2', ar:'ماذا يرمز "NOC"؟', en:'What does "NOC" stand for?',
      options:[{ar:'شهادة عدم ممانعة',en:'Non-Objection Certificate'},{ar:'إشعار اكتمال',en:'Notice of Completion'},{ar:'عقد مالك جديد',en:'New Owner Contract'}], answer:0 },
    { id:'q3', ar:'في إعادة البيع الجاهز، أي مستند يُلزم الطرفين أولاً؟', en:'In ready resale, which document binds both parties first?',
      options:[{ar:'SPA',en:'SPA'},{ar:'سند الملكية',en:'Title Deed'},{ar:'MOU',en:'MOU'}], answer:2 },
  ];

  const SCENARIOS = {
    investor:  { ar:'مستثمر', en:'Investor' },
    end_user:  { ar:'مستخدم نهائي', en:'End User' },
    tenant:    { ar:'مستأجر', en:'Tenant' },
    defaulter: { ar:'متعثر', en:'Defaulter' },
  };

  const generateScenario = () => {
    if (!scenarioType) return;
    const s = {
      investor: lang==='ar'
        ? `🎭 **السيناريو: مستثمر يبحث عن ROI**\n\nالعميل أحمد، 45 سنة، لديه AED 2M يريد استثمارها.\n\n**اعتراضه:** "السوق غير مستقر الآن"\n\n**ردك المقترح:** "أستاذ أحمد، في الواقع ممشى السعديات ارتفع 3 أضعاف خلال 3 سنوات. عائد الإيجار الصافي في أبوظبي يتراوح بين 6-8%. هل تريد أن نحسب ROI لشقة محددة؟"\n\n💡 **نصيحة:** تحدث دائماً بالأرقام والبيانات مع المستثمرين.`
        : `🎭 **Scenario: ROI-Focused Investor**\n\nClient Ahmed, 45, has AED 2M to invest.\n\n**Objection:** "The market is unstable now"\n\n**Suggested Response:** "Mr. Ahmed, Saadiyat Grove actually tripled in value over 3 years. Net rental yields in Abu Dhabi range 6-8%. Shall we calculate ROI on a specific unit?"\n\n💡 **Tip:** Always speak in numbers with investors.`,
      end_user: lang==='ar'
        ? `🎭 **السيناريو: مستخدم نهائي يبحث عن منزل**\n\nالعميلة سارة، أم لطفلين، تريد شقة في منطقة هادئة.\n\n**اعتراضها:** "السعر مرتفع جداً"\n\n**ردك المقترح:** "أنا أفهم مخاوفك. دعينا ننظر لخيارات التمويل — مع موافقة مسبقة، الدفعة الأولى 20% فقط والباقي على 25 سنة. هذا يعني قسطاً شهرياً يناسب ميزانيتك."\n\n💡 **نصيحة:** ركز على حلول التمويل وليس السعر الكلي.`
        : `🎭 **Scenario: End-User Home Seeker**\n\nClient Sara, mother of 2, wants an apartment in a quiet area.\n\n**Objection:** "The price is too high"\n\n**Suggested Response:** "I understand your concern. Let's look at financing — with pre-approval, only 20% down payment and the rest over 25 years. This means monthly installments that fit your budget."\n\n💡 **Tip:** Focus on financing solutions, not the total price.`,
      tenant: lang==='ar'
        ? `🎭 **السيناريو: مستأجر يريد الانتقال**\n\nالعميل خالد، يستأجر بـ AED 80K ويريد تغيير المكان.\n\n**اعتراضه:** "لماذا أدفع عمولة؟"\n\n**ردك المقترح:** "أستاذ خالد، نحن لا نوفر العقار فقط — نوفر لك الوقت والأمان. نحن نفرز العقارات، نتفاوض على السعر، ونتأكد من سلامة العقد. هذا يستحق العمولة."\n\n💡 **نصيحة:** أثبت قيمتك قبل الحديث عن السعر.`
        : `🎭 **Scenario: Tenant Looking to Move**\n\nClient Khaled rents for AED 80K and wants a change.\n\n**Objection:** "Why should I pay commission?"\n\n**Suggested Response:** "Mr. Khaled, we don't just find properties — we save you time and ensure your security. We screen properties, negotiate prices, and verify contracts. That's worth the commission."\n\n💡 **Tip:** Prove your value before discussing fees.`,
      defaulter: lang==='ar'
        ? `🎭 **السيناريو: عميل متعثر يريد البيع**\n\nالمالك محمد، لديه قرض ويريد البيع بسرعة.\n\n**اعتراضه:** "لا أريد خسارة كبيرة"\n\n**ردك المقترح:** "أستاذ محمد، الوضع الحالي يتطلب حلاً سريعاً. إذا باعنا بسعر السوق الآن نتجنب الفوائد المتراكمة. سنعمل على NOC أولاً وبعدها نضع السعر المناسب."\n\n💡 **نصيحة:** كن صريحاً وعملياً — المتعثر يحتاج حلاً لا وعوداً.`
        : `🎭 **Scenario: Defaulter Needing Quick Sale**\n\nOwner Mohammed has a loan and needs to sell fast.\n\n**Objection:** "I don't want to lose too much"\n\n**Suggested Response:** "Mr. Mohammed, the current situation requires a quick solution. Selling at market price now avoids accumulating interest. We'll start with the NOC process, then price it competitively."\n\n💡 **Tip:** Be direct and practical — defaulters need solutions, not promises.`,
    };
    setScenario(s[scenarioType]||'');
  };

  const moduleContent = {
    intro: (
      <div>
        <p style={{ fontSize:16,lineHeight:2,marginBottom:20 }}>في هذه الجلسة، ستكتسب فهماً كاملاً لسوق العقارات في أبوظبي، بما في ذلك العقارات قيد الإنشاء (Off-Plan) والعقارات الجاهزة (Ready Resale). تم تصميم هذا التدريب ليمنحك الأدوات والمعرفة والثقة لتحقيق النجاح بمنهجية وكفاءة.</p>
        <div style={{ background:'rgba(26,58,255,0.08)',border:'1px solid rgba(26,58,255,0.2)',borderRadius:14,padding:'20px 24px',marginBottom:24,borderRight:'4px solid #1a3aff' }}>
          <p style={{ fontSize:17,fontWeight:700,fontStyle:'italic',margin:0 }}>"نحن لا نبيع العقارات فقط — بل نبني الثقة والعلاقات طويلة الأمد."</p>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12 }}>
          {[{n:'14',l:'وحدة تدريبية',c:'#1a3aff'},{n:'12',l:'درس تفاعلي',c:'#00d4ff'},{n:'1',l:'محاكي سيناريوهات',c:'#f5a623'}].map(i=>(
            <div key={i.n} style={{ textAlign:'center',padding:'20px 16px',background:'rgba(255,255,255,0.04)',borderRadius:14,border:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize:36,fontWeight:900,color:i.c,fontFamily:'Cairo,Inter,sans-serif' }}>{i.n}</div>
              <div style={{ fontSize:12,color:'#9aabcc',marginTop:4 }}>{i.l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    m1: (
      <div>
        <div style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:16,fontWeight:800,color:'#00d4ff',marginBottom:12,display:'flex',alignItems:'center',gap:8 }}>🏘️ أنواع العقارات</h3>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            {[{t:'أرض',s:'تجارية / سكنية',c:'#f5a623'},{t:'مبنى',s:'تجاري / سكني',c:'#1a3aff'},{t:'شقة',s:'استوديو / لوفت / دوبلكس / بنتهاوس',c:'#00d4ff'},{t:'فيلا',s:'مزدوجة / دوبلكس / تاون هاوس',c:'#00e676'}].map(i=>(
              <div key={i.t} style={{ padding:'14px 16px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:`1px solid ${i.c}33`,borderRight:`3px solid ${i.c}` }}>
                <div style={{ fontSize:15,fontWeight:800,color:'#fff' }}>{i.t}</div>
                <div style={{ fontSize:12,color:'#9aabcc',marginTop:4 }}>{i.s}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:16,fontWeight:800,color:'#00d4ff',marginBottom:12 }}>🔄 أنواع البيع</h3>
          {[{t:'جاهز (إعادة بيع)',s:'من المالك الحالي مباشرة',c:'#00e676'},{t:'على الخارطة (Off-Plan)',s:'مباشرة من المطور أو من المالك قبل التسليم',c:'#1a3aff'}].map(i=>(
            <div key={i.t} style={{ padding:'14px 16px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:`1px solid ${i.c}33`,marginBottom:10,display:'flex',alignItems:'flex-start',gap:12 }}>
              <div style={{ width:10,height:10,borderRadius:'50%',background:i.c,flexShrink:0,marginTop:5 }}/>
              <div><div style={{ fontWeight:700,color:'#fff' }}>{i.t}</div><div style={{ fontSize:12,color:'#9aabcc',marginTop:3 }}>{i.s}</div></div>
            </div>
          ))}
        </div>
        <div style={{ background:'rgba(245,166,35,0.08)',border:'1px solid rgba(245,166,35,0.2)',borderRadius:12,padding:'14px 18px',borderRight:'4px solid #f5a623' }}>
          <p style={{ margin:0,fontSize:13,fontWeight:600,color:'#ffcf68' }}>💡 التسعير يعتمد على: الموقع • المساحة • الإطلالة • مستوى الطابق • وسائل الراحة • القرب من المعالم</p>
        </div>
      </div>
    ),
    m2: (
      <div>
        <h3 style={{ fontSize:16,fontWeight:800,color:'#00d4ff',marginBottom:16 }}>📋 المصطلحات العقارية الرئيسية</h3>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {[
            {t:'SPA',s:'اتفاقية البيع والشراء (Sale & Purchase Agreement)'},
            {t:'MOU',s:'مذكرة تفاهم (Memorandum of Understanding)'},
            {t:'S.D',s:'شيك ضمان 10% (Security Deposit)'},
            {t:'ADM Fees',s:'رسوم بلدية أبوظبي 2% من سعر البيع'},
            {t:'Admin Fees',s:'رسوم إدارية لنقل الملكية (تدفع للمطور)'},
            {t:'NOC',s:'شهادة عدم ممانعة (No-Objection Certificate)'},
            {t:'Escrow',s:'حساب ضمان المطور'},
            {t:'Mg Cheque',s:'شيك مدير (Manager\'s Cheque)'},
            {t:'Title Deed',s:'سند الملكية — إثبات رسمي للملكية'},
            {t:'S.Ch',s:'رسوم الخدمة (Service Charges)'},
          ].map((r,i)=>(
            <div key={r.t} style={{ display:'flex',alignItems:'center',gap:16,padding:'12px 16px',borderRadius:10,background:i%2===0?'rgba(255,255,255,0.03)':'rgba(26,58,255,0.04)',border:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ minWidth:100,fontFamily:'monospace',fontSize:13,fontWeight:800,color:'#7a9fff',background:'rgba(26,58,255,0.12)',padding:'4px 10px',borderRadius:7 }}>{r.t}</div>
              <div style={{ fontSize:13,color:'#e8eeff' }}>{r.s}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16,background:'rgba(26,58,255,0.08)',border:'1px solid rgba(26,58,255,0.2)',borderRadius:12,padding:'14px 18px',borderRight:'4px solid #1a3aff' }}>
          <p style={{ margin:0,fontSize:13,color:'#7a9fff',fontWeight:600 }}>💡 إتقان هذه المصطلحات يبني المصداقية الفورية مع العملاء.</p>
        </div>
      </div>
    ),
    m3: (
      <div>
        <div style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:16,fontWeight:800,color:'#00d4ff',marginBottom:16 }}>🏗️ عمليات بيع Off-Plan</h3>
          <div style={{ display:'flex',gap:0,overflowX:'auto',paddingBottom:8 }}>
            {['إحاطة المطور','حملة تسويقية','تصفية العملاء','حجز المواعيد','إغلاق الصفقة'].map((s,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center',flexShrink:0 }}>
                <div style={{ textAlign:'center',minWidth:110,padding:'14px 10px',background:`rgba(26,58,255,${0.08+i*0.03})`,border:'1px solid rgba(26,58,255,0.25)',borderRadius:12 }}>
                  <div style={{ fontSize:20,fontWeight:900,color:'#1a3aff',fontFamily:'Cairo,Inter,sans-serif' }}>{i+1}</div>
                  <div style={{ fontSize:11,color:'#e8eeff',marginTop:4,lineHeight:1.4 }}>{s}</div>
                </div>
                {i<4 && <div style={{ fontSize:18,color:'#3e4f72',margin:'0 4px' }}>›</div>}
              </div>
            ))}
          </div>
        </div>
        <h3 style={{ fontSize:16,fontWeight:800,color:'#00d4ff',marginBottom:12 }}>💰 تكاليف Off-Plan</h3>
        <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
          {[{t:'دفعة أولى',v:'5-10% من سعر الوحدة',c:'#1a3aff'},{t:'رسوم ADM',v:'2% من السعر الأصلي',c:'#00d4ff'},{t:'عمولة الوكالة',v:'2% + VAT',c:'#f5a623'},{t:'شيك ضمان',v:'10% (مسترد)',c:'#00e676'},{t:'رسوم NOC / إدارية',v:'تختلف حسب المطور',c:'#9aabcc'}].map(r=>(
            <div key={r.t} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 16px',borderRadius:9,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize:13,color:'#e8eeff',fontWeight:600 }}>{r.t}</span>
              <span style={{ fontSize:13,fontWeight:800,color:r.c }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    m4: (
      <div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20 }}>
          {[{title:'قيد الإنشاء (Off-Plan)',color:'#1a3aff',items:['دفعة أولى: 5-10%','تسجيل: 2% عبر DARI','جميع الدفعات عبر Escrow','شيكات مؤجلة (PDCs)']},{title:'جاهز (Ready Resale)',color:'#00e676',items:['شيك ضمان: 10%','تسجيل: 2% من سعر البيع','عمولة: 2% + VAT','شروط MOU عند التراجع']}].map(s=>(
            <div key={s.title} style={{ padding:'20px',borderRadius:14,background:'rgba(255,255,255,0.03)',border:`1px solid ${s.color}33`,borderTop:`3px solid ${s.color}` }}>
              <h4 style={{ fontSize:14,fontWeight:800,color:s.color,marginBottom:14 }}>{s.title}</h4>
              {s.items.map(i=><div key={i} style={{ fontSize:13,color:'#e8eeff',marginBottom:8,display:'flex',alignItems:'center',gap:8 }}><span style={{ color:s.color }}>✓</span>{i}</div>)}
            </div>
          ))}
        </div>
        <div style={{ background:'rgba(255,68,68,0.08)',border:'1px solid rgba(255,68,68,0.2)',borderRadius:12,padding:'14px 18px',borderRight:'4px solid #ff4444' }}>
          <p style={{ margin:0,fontSize:13,color:'#ff9999',fontWeight:600 }}>⚠️ التراجع: إذا تراجع أحد الأطراف، المبلغ المتبقي يذهب للطرف الآخر.</p>
        </div>
      </div>
    ),
    m5: (
      <div>
        <h3 style={{ fontSize:16,fontWeight:800,color:'#00d4ff',marginBottom:16 }}>🏦 سيناريوهات الرهن العقاري</h3>
        {[
          {t:'نقدي ← نقدي',s:'MOU ← NOC ← نقل ملكية ← شيك مدير للبائع',c:'#00e676'},
          {t:'مشتري نقدي ← بائع ممول',s:'خطاب التزامات ← MOU ← تقييم ← NOC ← شيكان مدير',c:'#1a3aff'},
          {t:'مشتري ممول ← بائع نقدي',s:'موافقة مسبقة ← MOU ← تقييم ← NOC ← شيك مدير ← خطاب إعلان رهن',c:'#f5a623'},
          {t:'ممول ← ممول',s:'موافقة مسبقة ← تقييم ← NOC ← شيك 20% ← تحويل 80% لبنك البائع',c:'#00d4ff'},
        ].map((r,i)=>(
          <div key={i} style={{ marginBottom:12,padding:'16px',borderRadius:12,background:'rgba(255,255,255,0.03)',border:`1px solid ${r.c}22`,borderRight:`3px solid ${r.c}` }}>
            <div style={{ fontSize:14,fontWeight:800,color:r.c,marginBottom:8 }}>{r.t}</div>
            <div style={{ fontSize:12,color:'#9aabcc',lineHeight:1.8 }}>{r.s}</div>
          </div>
        ))}
      </div>
    ),
    m6: (
      <div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20 }}>
          <div style={{ padding:'20px',borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(0,230,118,0.2)',borderTop:'3px solid #00e676' }}>
            <h4 style={{ fontSize:14,fontWeight:800,color:'#00e676',marginBottom:14 }}>📊 حساب ROI</h4>
            <div style={{ fontSize:13,color:'#e8eeff',lineHeight:2 }}>
              <div style={{ marginBottom:8,padding:'8px 12px',borderRadius:8,background:'rgba(0,230,118,0.08)' }}><b>إجمالي</b> = إيجار ÷ سعر البيع</div>
              <div style={{ padding:'8px 12px',borderRadius:8,background:'rgba(0,230,118,0.08)' }}><b>صافي</b> = (إيجار — رسوم خدمة) ÷ سعر</div>
            </div>
          </div>
          <div style={{ padding:'20px',borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(245,166,35,0.2)',borderTop:'3px solid #f5a623' }}>
            <h4 style={{ fontSize:14,fontWeight:800,color:'#f5a623',marginBottom:14 }}>📈 الربح التاريخي</h4>
            {[{y:'السنة 1',v:'30-40%'},{y:'السنة 2',v:'40-60%'},{y:'السنة 3',v:'60-75%'}].map(r=>(
              <div key={r.y} style={{ display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13 }}>
                <span style={{ color:'#9aabcc' }}>{r.y}</span><span style={{ color:'#ffcf68',fontWeight:800 }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:'rgba(26,58,255,0.08)',border:'1px solid rgba(26,58,255,0.2)',borderRadius:12,padding:'14px 18px',borderRight:'4px solid #1a3aff' }}>
          <p style={{ margin:0,fontSize:13,color:'#7a9fff',fontWeight:600 }}>💡 مثال: ممشى السعديات ارتفع 3 أضعاف. استخدم منطق ROI والربح لمساعدة المستثمرين على اتخاذ قراراتهم.</p>
        </div>
      </div>
    ),
    m7: (
      <div>
        <h3 style={{ fontSize:16,fontWeight:800,color:'#00d4ff',marginBottom:16 }}>👥 تصنيف العملاء</h3>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20 }}>
          {[{t:'مستأجر',s:'يركز على الإيجار والموقع والمرافق',c:'#00d4ff',i:'🏠'},{t:'مستثمر',s:'يركز على ROI والربح وارتفاع القيمة',c:'#f5a623',i:'📈'},{t:'مستخدم نهائي',s:'يركز على السكن والبيئة والمدارس',c:'#00e676',i:'👨‍👩‍👧'},{t:'متعثر',s:'يحتاج بيع عاجل بسعر تنافسي',c:'#ff4444',i:'⚡'}].map(c=>(
            <div key={c.t} style={{ padding:'16px',borderRadius:12,background:'rgba(255,255,255,0.03)',border:`1px solid ${c.c}33` }}>
              <div style={{ fontSize:24,marginBottom:8 }}>{c.i}</div>
              <div style={{ fontSize:14,fontWeight:800,color:c.c,marginBottom:6 }}>{c.t}</div>
              <div style={{ fontSize:12,color:'#9aabcc' }}>{c.s}</div>
            </div>
          ))}
        </div>
        <h4 style={{ fontSize:14,fontWeight:800,color:'#e8eeff',marginBottom:12 }}>❓ أسئلة يجب طرحها</h4>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {['للسكن أم للاستثمار؟','ما الميزانية وهل هناك تمويل؟','ما المنطقة المفضلة؟','على الخارطة أم جاهز؟','ما حجم الوحدة ونوعها؟'].map((q,i)=>(
            <div key={i} style={{ padding:'10px 16px',borderRadius:9,background:'rgba(26,58,255,0.06)',border:'1px solid rgba(26,58,255,0.15)',fontSize:13,color:'#e8eeff',display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ color:'#7a9fff',fontWeight:800,minWidth:20 }}>{i+1}.</span>{q}
            </div>
          ))}
        </div>
      </div>
    ),
    m8: (
      <div>
        {[{title:'الملاك (البائعون / المؤجرون)',icon:'🏠',color:'#1a3aff',items:['المستندات المستلمة (نسخ)','اتفاقية العرض (Madmon / A to A / حصرية)','مواد التسويق (صور، فيديوهات)','سجل التواصل (مكالمات، واتساب)']},{title:'المشترون',icon:'🤝',color:'#00d4ff',items:['المستندات / KYC (جواز سفر، إقامة، هوية)','خطاب اهتمام، MOU، SPA','قائمة العقارات المختصرة','مستندات نقل الملكية']},{title:'المستأجرون',icon:'🔑',color:'#00e676',items:['جواز سفر، إقامة، هوية إماراتية','عقد الإيجار (نماذج توثيق)','إيصالات شيك الضمان والعمولة','مساعدة الانتقال (توصيل الخدمات)']},{title:'المطورون',icon:'🏗️',color:'#f5a623',items:['اتفاقية الوكالة (إثبات تسجيل الوسيط)','معلومات المشروع (بروشورات، قوائم أسعار)','قوائم التوفر (مخزون محدث)','نماذج الحجز الموقعة']}].map(s=>(
          <div key={s.title} style={{ marginBottom:16,padding:'18px',borderRadius:14,background:'rgba(255,255,255,0.03)',border:`1px solid ${s.color}22`,borderRight:`3px solid ${s.color}` }}>
            <h4 style={{ fontSize:14,fontWeight:800,color:s.color,marginBottom:12 }}>{s.icon} {s.title}</h4>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:7 }}>
              {s.items.map(i=><div key={i} style={{ fontSize:12,color:'#9aabcc',display:'flex',alignItems:'flex-start',gap:6 }}><span style={{ color:s.color,flexShrink:0 }}>✓</span>{i}</div>)}
            </div>
          </div>
        ))}
      </div>
    ),
    m9: (
      <div>
        <h3 style={{ fontSize:16,fontWeight:800,color:'#00d4ff',marginBottom:16 }}>✅ قائمة مراجعة تسجيل المالك</h3>
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {[{n:1,t:'الحصول على تفاصيل المالك كاملة (الاسم، التواصل، الجنسية)'},{n:2,t:'جمع معلومات العقار (النوع، المساحة، الإطلالة، مفروش/غير مفروش)'},{n:3,t:'التحقق من مستندات الملكية (سند ملكية / SPA)'},{n:4,t:'نسخة من جواز السفر والهوية الإماراتية'},{n:5,t:'توكيل رسمي (إن وجد)'},{n:6,t:'مخطط الطابق (إن وجد)'},{n:7,t:'إيصال رسوم الخدمة (اختياري)'},{n:8,t:'تسجيل "مضمون" (Madmoun)'},{n:9,t:'التقاط صور / فيديوهات احترافية'},{n:10,t:'الرفع على البوابات (بيوت، بروبرتي فايندر، إلخ)'}].map(i=>(
            <div key={i.n} style={{ display:'flex',alignItems:'flex-start',gap:14,padding:'11px 16px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ minWidth:28,height:28,borderRadius:'50%',background:'rgba(0,212,255,0.12)',border:'1px solid rgba(0,212,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#00d4ff',flexShrink:0 }}>{i.n}</div>
              <div style={{ fontSize:13,color:'#e8eeff',lineHeight:1.6,paddingTop:4 }}>{i.t}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    m10: (
      <div>
        {[{title:'NOC من المطور',color:'#1a3aff',steps:['تصفية المستحقات','دفع رسوم NOC (3,000 - 5,250 درهم)','تقديم SPA وسند الملكية والهويات','الاستلام: 3-5 أيام عمل']},{title:'NOC من إدارة المجمع',color:'#00d4ff',steps:['تصفية رسوم الخدمة','التقديم عبر البوابة الإلكترونية','دفع تأمين (إذا لزم)','الاستلام: 2-3 أيام عمل']},{title:'أنظمة نقل الملكية',color:'#f5a623',steps:['البر الرئيسي لأبوظبي: TAMM / DARI / ADM','جزيرة الريم / المارية (منطقة حرة): بوابة ADGM']}].map(s=>(
          <div key={s.title} style={{ marginBottom:16,padding:'18px',borderRadius:14,background:'rgba(255,255,255,0.03)',border:`1px solid ${s.color}22`,borderRight:`3px solid ${s.color}` }}>
            <h4 style={{ fontSize:14,fontWeight:800,color:s.color,marginBottom:12 }}>{s.title}</h4>
            {s.steps.map((st,i)=><div key={i} style={{ fontSize:13,color:'#e8eeff',marginBottom:7,display:'flex',alignItems:'flex-start',gap:8 }}><span style={{ color:s.color,fontWeight:700,flexShrink:0 }}>{i+1}.</span>{st}</div>)}
          </div>
        ))}
        <div style={{ background:'rgba(255,68,68,0.08)',border:'1px solid rgba(255,68,68,0.25)',borderRadius:12,padding:'14px 18px',borderRight:'4px solid #ff4444' }}>
          <p style={{ margin:0,fontSize:13,color:'#ff9999',fontWeight:700 }}>⚠️ لا نقل ملكية بدون NOC. ابدأ دائماً عملية NOC مبكراً بمجرد الاتفاق على الصفقة.</p>
        </div>
      </div>
    ),
    m11: (
      <div>
        <div style={{ marginBottom:20,padding:'18px',borderRadius:14,background:'rgba(26,58,255,0.06)',border:'1px solid rgba(26,58,255,0.2)' }}>
          <h4 style={{ fontSize:14,fontWeight:800,color:'#7a9fff',marginBottom:12 }}>💼 لماذا نذكر رسوم الوكالة؟</h4>
          <p style={{ fontSize:13,color:'#e8eeff',lineHeight:1.9,margin:0 }}>نحن لا نعرض العقارات فقط — ندير التسويق، فرز العملاء، التفاوض، وإغلاق الصفقات. هذا يستحق العمولة.</p>
        </div>
        <h4 style={{ fontSize:14,fontWeight:800,color:'#e8eeff',marginBottom:14 }}>🎯 نصائح للوكلاء الجدد</h4>
        <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
          {['ابنِ العلاقات أولاً، ثم قم بالبيع ثانياً','اجعل كل شيء مكتوباً','الصور والفيديوهات مهمة — استخدم محتوى احترافياً','تحقق دائماً من رسوم الخدمة','حدّث قوائمك أسبوعياً','كن صريحاً بشأن الأسعار والجداول الزمنية'].map((tip,i)=>(
            <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize:18,flexShrink:0 }}>{'💡🖊️📸🔍📅🎯'[i]}</span>
              <span style={{ fontSize:13,color:'#e8eeff',lineHeight:1.6 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    m12: (
      <div>
        <h3 style={{ fontSize:16,fontWeight:800,color:'#00d4ff',marginBottom:20 }}>🧪 اختبار المعرفة</h3>
        {QUIZ.map((q,qi)=>(
          <div key={q.id} style={{ marginBottom:20,padding:'20px',borderRadius:14,background:'rgba(255,255,255,0.03)',border:`1px solid ${quizDone?(quizAnswers[q.id]===q.answer?'rgba(0,230,118,0.3)':'rgba(255,68,68,0.3)'):'rgba(255,255,255,0.08)'}` }}>
            <div style={{ fontSize:14,fontWeight:700,color:'#e8eeff',marginBottom:14 }}>{qi+1}. {lang==='ar'?q.ar:q.en}</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {q.options.map((opt,oi)=>{
                const selected = quizAnswers[q.id]===oi;
                const correct  = oi===q.answer;
                let bg='rgba(255,255,255,0.04)', bc='rgba(255,255,255,0.1)', tc='#9aabcc';
                if (quizDone) {
                  if (correct) { bg='rgba(0,230,118,0.1)'; bc='rgba(0,230,118,0.4)'; tc='#00e676'; }
                  else if (selected) { bg='rgba(255,68,68,0.08)'; bc='rgba(255,68,68,0.3)'; tc='#ff4444'; }
                } else if (selected) { bg='rgba(26,58,255,0.12)'; bc='rgba(26,58,255,0.4)'; tc='#7a9fff'; }
                return (
                  <button key={oi} onClick={()=>!quizDone&&setQuizAnswers(a=>({...a,[q.id]:oi}))}
                    style={{ padding:'11px 16px',borderRadius:10,background:bg,border:`1px solid ${bc}`,color:tc,fontSize:13,fontWeight:600,cursor:quizDone?'default':'pointer',textAlign:'right',display:'flex',alignItems:'center',gap:10,fontFamily:"'Cairo',sans-serif",transition:'all .15s' }}>
                    <span style={{ width:22,height:22,borderRadius:'50%',border:`1.5px solid ${bc}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0 }}>
                      {quizDone&&correct?'✓':quizDone&&selected?'✗':String.fromCharCode(65+oi)}
                    </span>
                    {lang==='ar'?opt.ar:opt.en}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!quizDone ? (
          <button onClick={()=>setQuizDone(true)} disabled={Object.keys(quizAnswers).length<QUIZ.length}
            style={{ width:'100%',padding:'13px',borderRadius:12,background:Object.keys(quizAnswers).length<QUIZ.length?'rgba(26,58,255,0.3)':'#1a3aff',color:'#fff',border:'none',fontSize:14,fontWeight:700,cursor:Object.keys(quizAnswers).length<QUIZ.length?'not-allowed':'pointer',fontFamily:"'Cairo',sans-serif" }}>
            {Object.keys(quizAnswers).length<QUIZ.length?`أجب على ${QUIZ.length-Object.keys(quizAnswers).length} سؤال متبقي`:'تحقق من إجاباتي ✓'}
          </button>
        ) : (
          <div style={{ textAlign:'center',padding:'24px',borderRadius:14,background:'rgba(0,230,118,0.08)',border:'1px solid rgba(0,230,118,0.2)' }}>
            <div style={{ fontSize:40,marginBottom:8 }}>{QUIZ.filter(q=>quizAnswers[q.id]===q.answer).length===QUIZ.length?'🎉':'💪'}</div>
            <div style={{ fontSize:22,fontWeight:900,color:'#00e676',fontFamily:'Cairo,Inter,sans-serif' }}>{QUIZ.filter(q=>quizAnswers[q.id]===q.answer).length}/{QUIZ.length}</div>
            <div style={{ fontSize:13,color:'#9aabcc',marginTop:6 }}>{QUIZ.filter(q=>quizAnswers[q.id]===q.answer).length===QUIZ.length?'ممتاز! أجبت على كل الأسئلة بشكل صحيح':'راجع الإجابات الخاطئة وحاول مرة أخرى'}</div>
            <button onClick={()=>{setQuizAnswers({});setQuizDone(false);}} style={{ marginTop:14,padding:'9px 24px',borderRadius:10,background:'rgba(26,58,255,0.15)',border:'1px solid rgba(26,58,255,0.3)',color:'#7a9fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Cairo',sans-serif" }}>إعادة الاختبار</button>
          </div>
        )}
      </div>
    ),
    sim: (
      <div>
        <h3 style={{ fontSize:16,fontWeight:800,color:'#f5a623',marginBottom:8,display:'flex',alignItems:'center',gap:8 }}><span>✨</span>محاكي سيناريوهات العملاء</h3>
        <p style={{ fontSize:13,color:'#9aabcc',marginBottom:20 }}>اختر نوع العميل وسيقوم النظام بإنشاء سيناريو تدريبي مع اعتراضات شائعة ونصائح للتعامل معها.</p>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
          {Object.entries(SCENARIOS).map(([k,v])=>(
            <button key={k} onClick={()=>setScenarioType(k)}
              style={{ padding:'14px 16px',borderRadius:12,background:scenarioType===k?'rgba(26,58,255,0.18)':'rgba(255,255,255,0.04)',border:`1.5px solid ${scenarioType===k?'rgba(26,58,255,0.5)':'rgba(255,255,255,0.1)'}`,color:scenarioType===k?'#7a9fff':'#9aabcc',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Cairo',sans-serif",display:'flex',alignItems:'center',gap:10,transition:'all .15s' }}>
              <span style={{ fontSize:20 }}>{k==='investor'?'📈':k==='end_user'?'🏠':k==='tenant'?'🔑':'⚡'}</span>
              {lang==='ar'?v.ar:v.en}
            </button>
          ))}
        </div>
        <button onClick={generateScenario} disabled={!scenarioType}
          style={{ width:'100%',padding:'13px',borderRadius:12,background:scenarioType?'linear-gradient(135deg,#f5a623,#ffcf68)':'rgba(255,255,255,0.05)',color:scenarioType?'#000':'#3e4f72',border:'none',fontSize:14,fontWeight:800,cursor:scenarioType?'pointer':'not-allowed',fontFamily:"'Cairo',sans-serif",marginBottom:16,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
          <span>⚡</span> توليد السيناريو التدريبي
        </button>
        {scenario && (
          <div style={{ padding:'20px',borderRadius:14,background:'rgba(245,166,35,0.06)',border:'1px solid rgba(245,166,35,0.2)',whiteSpace:'pre-wrap',fontSize:14,lineHeight:2,color:'#e8eeff',fontFamily:"'Cairo',sans-serif" }}>
            {scenario.split('**').map((s,i)=>i%2===1?<strong key={i} style={{ color:'#ffcf68' }}>{s}</strong>:<span key={i}>{s}</span>)}
          </div>
        )}
      </div>
    ),
  };

  const totalModules = MODULES.filter(m=>m.id!=='sim').length;
  const done = progress.length;
  const pct  = Math.round((done/totalModules)*100);

  return (
    <div className="makan-academy" dir={rtl?'rtl':'ltr'} style={{ display:'flex',gap:0,minHeight:'80vh' }}>
      {/* ── LEFT SIDEBAR ── */}
      <div className="makan-academy-sidebar" style={{ width:260,flexShrink:0,background:'rgba(9,14,28,0.5)',borderRadius:'16px 0 0 16px',border:'1px solid rgba(62,79,114,0.4)',overflowY:'auto',display:'flex',flexDirection:'column' }}>
        {/* Progress */}
        <div style={{ padding:'20px 16px',borderBottom:'1px solid rgba(62,79,114,0.4)' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
            <span style={{ fontSize:12,fontWeight:700,color:'#9aabcc' }}>التقدم الكلي</span>
            <span style={{ fontSize:13,fontWeight:800,color:'#f5a623' }}>{pct}%</span>
          </div>
          <div style={{ height:6,background:'rgba(255,255,255,0.06)',borderRadius:6,overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#f5a623,#ffcf68)',borderRadius:6,transition:'width .4s' }}/>
          </div>
        </div>
        {/* Module list */}
        <div style={{ flex:1,padding:'10px 8px',overflowY:'auto' }}>
          {MODULES.map(m=>{
            const isActive  = activeModule === m.id;
            const isDone    = progress.includes(m.id);
            const isSim     = m.id === 'sim';
            return (
              <button key={m.id} onClick={()=>setActiveModule(m.id)}
                style={{ width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:'none',cursor:'pointer',marginBottom:3,textAlign:rtl?'right':'left',fontFamily:"'Cairo',sans-serif",fontSize:12,fontWeight:isActive?700:500,transition:'all .15s',
                  background: isActive ? (isSim?'rgba(245,166,35,0.15)':'rgba(26,58,255,0.18)') : 'transparent',
                  color: isActive ? (isSim?'#ffcf68':'#7a9fff') : isDone?'#9aabcc':'#64748b',
                  boxShadow: isActive ? `inset 0 0 0 1px ${isSim?'rgba(245,166,35,0.4)':'rgba(26,58,255,0.4)'}` : 'none',
                }}>
                <span style={{ fontSize:14,flexShrink:0 }}>{isDone&&!isSim?'✅':m.icon}</span>
                <span style={{ flex:1 }}>{lang==='ar'?m.ar:m.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1,minWidth:0,background:'rgba(13,21,38,0.6)',borderRadius:'0 16px 16px 0',border:'1px solid rgba(62,79,114,0.4)',borderRight:rtl?'1px solid rgba(62,79,114,0.4)':'none',overflowY:'auto',padding:'28px 32px',display:'flex',flexDirection:'column',gap:0 }}>
        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12 }}>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:6 }}>
              <span style={{ fontSize:24 }}>{MODULES.find(m=>m.id===activeModule)?.icon}</span>
              <h2 style={{ fontSize:20,fontWeight:900,color:'#ffffff',margin:0,fontFamily:"'Cairo',sans-serif" }}>
                {lang==='ar'?MODULES.find(m=>m.id===activeModule)?.ar:MODULES.find(m=>m.id===activeModule)?.en}
              </h2>
            </div>
          </div>
          {activeModule!=='sim' && activeModule!=='m12' && (
            <button onClick={()=>{markDone(activeModule);const idx=MODULES.findIndex(m=>m.id===activeModule);if(idx<MODULES.length-1)setActiveModule(MODULES[idx+1].id);}}
              style={{ padding:'9px 20px',borderRadius:10,background:progress.includes(activeModule)?'rgba(0,230,118,0.1)':'rgba(26,58,255,0.15)',border:`1px solid ${progress.includes(activeModule)?'rgba(0,230,118,0.3)':'rgba(26,58,255,0.3)'}`,color:progress.includes(activeModule)?'#00e676':'#7a9fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Cairo',sans-serif",display:'flex',alignItems:'center',gap:7,flexShrink:0 }}>
              {progress.includes(activeModule)?<><span>✅</span>تم</>:<><span>›</span>إتمام والتالي</>}
            </button>
          )}
        </div>
        {/* Content */}
        <div style={{ color:'#e8eeff',fontFamily:"'Cairo','Tajawal',sans-serif",lineHeight:1.85 }}>
          {moduleContent[activeModule]}
        </div>
      </div>
    </div>
  );
}
