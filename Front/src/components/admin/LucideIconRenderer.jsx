import React from "react";
import {
  Monitor,
  Globe,
  BookOpen,
  Users,
  Heart,
  Briefcase,
  Code,
  Cpu,
  Database,
  FileText,
  Hammer,
  Headphones,
  Home,
  Layers,
  Lightbulb,
  MapPin,
  Megaphone,
  Music,
  Palette,
  PenTool,
  Phone,
  Plane,
  Scale,
  Scissors,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Stethoscope,
  TrendingUp,
  Truck,
  Wrench,
  Zap,
  Building,
  Camera,
  GraduationCap,
  Landmark,
  Leaf,
  LineChart,
  Microscope,
  FolderKanban,
  Activity,
  Atom,
  BarChart,
  Binary,
  Bot,
  Brain,
  Calculator,
  Clapperboard,
  Cloud,
  Compass,
  Construction,
  Dumbbell,
  Factory,
  Flame,
  FlaskConical,
  Gamepad2,
  Gavel,
  HandHelping,
  HardHat,
  Hotel,
  LandPlot,
  Languages,
  Library,
  Mic,
  Mountain,
  Newspaper,
  Paintbrush,
  Pill,
  Presentation,
  Radio,
  Rocket,
  Satellite,
  Server,
  Ship,
  Sparkles,
  Swords,
  TestTube,
  Theater,
  TreePine,
  Trophy,
  Tv,
  UtensilsCrossed,
  Video,
  Waves,
  Wifi,
  Wine,
} from "lucide-react";

// Map of all supported Lucide icon names to their components
const ICON_MAP = {
  Monitor, Globe, BookOpen, Users, Heart, Briefcase, Code, Cpu, Database,
  FileText, Hammer, Headphones, Home, Layers, Lightbulb, MapPin, Megaphone,
  Music, Palette, PenTool, Phone, Plane, Scale, Scissors, Settings, Shield,
  ShoppingCart, Star, Stethoscope, TrendingUp, Truck, Wrench, Zap, Building,
  Camera, GraduationCap, Landmark, Leaf, LineChart, Microscope, FolderKanban,
  Activity, Atom, BarChart, Binary, Bot, Brain, Calculator, Clapperboard,
  Cloud, Compass, Construction, Dumbbell, Factory, Flame, FlaskConical,
  Gamepad2, Gavel, HandHelping, HardHat, Hotel, LandPlot, Languages, Library,
  Mic, Mountain, Newspaper, Paintbrush, Pill, Presentation, Radio, Rocket,
  Satellite, Server, Ship, Sparkles, Swords, TestTube, Theater, TreePine,
  Trophy, Tv, UtensilsCrossed, Video, Waves, Wifi, Wine,
};

/**
 * Renders a Lucide icon by its string name.
 * Falls back to a folder icon if name is not found.
 * If the value looks like an emoji, renders it directly.
 */
const LucideIconRenderer = ({ name, className = "w-5 h-5", fallback = null }) => {
  if (!name) return fallback || <FolderKanban className={className} />;

  // Check if it's an emoji (starts with non-ASCII)
  if (/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}]/u.test(name)) {
    return <span className="text-lg">{name}</span>;
  }

  const IconComponent = ICON_MAP[name];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Try case-insensitive match
  const lowerName = name.toLowerCase();
  const match = Object.entries(ICON_MAP).find(([key]) => key.toLowerCase() === lowerName);
  if (match) {
    const [, MatchedIcon] = match;
    return <MatchedIcon className={className} />;
  }

  // Fallback: render the text as-is (maybe it's an emoji or custom text)
  return <span className="text-lg">{name}</span>;
};

export default LucideIconRenderer;
export { ICON_MAP };
