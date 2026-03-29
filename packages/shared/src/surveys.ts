import { SiteType } from "./types";

// Answer format types
export type AnswerType = "single_choice" | "multi_choice" | "scale" | "boolean";

export interface SurveyQuestion {
  id: string;
  text: string;
  guidance: string;
  type: AnswerType;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  required: boolean;
}

export interface SurveySchema {
  siteType: SiteType;
  version: number;
  questions: SurveyQuestion[];
}

// --- Survey schemas per site type ---

const pondQuestions: SurveyQuestion[] = [
  {
    id: "pond_water_level",
    text: "What is the water level?",
    guidance: "Compare to the normal waterline — look for marks on banks, exposed mud, or submerged vegetation above the surface.",
    type: "single_choice",
    options: ["Dry", "Very low", "Low", "Normal", "High", "Flooded"],
    required: true,
  },
  {
    id: "pond_water_clarity",
    text: "How clear is the water?",
    guidance: "Look into the water near the edge. Can you see the bottom? Is the surface covered in algae or duckweed?",
    type: "single_choice",
    options: ["Clear", "Slightly cloudy", "Murky", "Opaque", "Algae-covered"],
    required: true,
  },
  {
    id: "pond_bank_condition",
    text: "What is the bank condition?",
    guidance: "Walk along the edge and look at the bank closest to you. Is it held together by plants, or bare and crumbling?",
    type: "single_choice",
    options: ["Natural/vegetated", "Eroded", "Trampled", "Reinforced", "Overgrown"],
    required: true,
  },
  {
    id: "pond_wildlife_signs",
    text: "Which wildlife signs are present?",
    guidance: "Stand still for 30 seconds and observe. Listen for frogs, look for ripples, dragonflies, birds on the water. Select all that apply.",
    type: "multi_choice",
    options: [
      "Birds",
      "Amphibians",
      "Fish",
      "Invertebrates",
      "Dragonflies/damselflies",
      "Mammals",
      "None observed",
    ],
    required: true,
  },
  {
    id: "pond_pollution_signs",
    text: "Any signs of pollution?",
    guidance: "Check for litter around the banks, unusual colours or smells in the water, oily sheens on the surface. Select all that apply.",
    type: "multi_choice",
    options: [
      "Litter",
      "Oil/chemical sheen",
      "Sewage smell",
      "Foam/scum",
      "Discoloured water",
      "None",
    ],
    required: true,
  },
  {
    id: "pond_overall",
    text: "Overall condition",
    guidance: "Based on everything you've observed, rate the overall health of this pond. 1 means severely degraded, 5 means thriving and natural.",
    type: "scale",
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { min: "Poor", max: "Excellent" },
    required: true,
  },
];

const hedgerowQuestions: SurveyQuestion[] = [
  {
    id: "hedge_height",
    text: "Approximate height?",
    guidance: "Estimate against your own height. An average person is about 1.7m tall.",
    type: "single_choice",
    options: ["Under 1m", "1–2m", "2–3m", "3–5m", "Over 5m"],
    required: true,
  },
  {
    id: "hedge_width",
    text: "Approximate width?",
    guidance: "Look at the hedge from the side. How deep is it from one face to the other?",
    type: "single_choice",
    options: ["Thin (under 1m)", "Medium (1–2m)", "Wide (2–3m)", "Very wide (3m+)"],
    required: true,
  },
  {
    id: "hedge_continuity",
    text: "How continuous is the hedgerow?",
    guidance: "Walk or look along its length. Are there breaks where you can see through, or is it a solid line of vegetation?",
    type: "single_choice",
    options: ["Continuous", "Small gaps", "Large gaps", "Fragmented"],
    required: true,
  },
  {
    id: "hedge_species_richness",
    text: "How many woody species can you count in a 30m stretch?",
    guidance: "Count different types of trees and shrubs (hawthorn, blackthorn, elder, hazel, etc.) in roughly 30 paces.",
    type: "single_choice",
    options: ["1 (monoculture)", "2–3", "4–5", "6+"],
    required: true,
  },
  {
    id: "hedge_base_flora",
    text: "What is the base/ground flora like?",
    guidance: "Look at the ground directly beneath and beside the hedge. What's growing at the base?",
    type: "single_choice",
    options: ["Bare", "Grass only", "Some wildflowers", "Rich wildflowers", "Overgrown/bramble"],
    required: true,
  },
  {
    id: "hedge_management",
    text: "Recent management visible?",
    guidance: "Look for signs of cutting (fresh pale wood, squared-off shape), laying (bent stems woven horizontally), or neglect.",
    type: "single_choice",
    options: ["Freshly cut", "Laid", "Unmanaged", "Flailed", "Coppiced"],
    required: true,
  },
  {
    id: "hedge_overall",
    text: "Overall condition",
    guidance: "Consider the height, width, species diversity, and continuity together. A healthy hedge is thick, tall, and species-rich.",
    type: "scale",
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { min: "Poor", max: "Excellent" },
    required: true,
  },
];

const meadowQuestions: SurveyQuestion[] = [
  {
    id: "meadow_grass_height",
    text: "Average grass/vegetation height?",
    guidance: "Hold your hand flat above the vegetation. How high does most of it reach? Ignore occasional tall stems.",
    type: "single_choice",
    options: ["Short (under 10cm)", "Medium (10–30cm)", "Tall (30–60cm)", "Very tall (60cm+)"],
    required: true,
  },
  {
    id: "meadow_flower_density",
    text: "Wildflower density?",
    guidance: "Look at a patch about 2m x 2m in front of you. How many flowering plants (not grass) can you see?",
    type: "single_choice",
    options: ["None", "Sparse", "Moderate", "Abundant", "Dominated by flowers"],
    required: true,
  },
  {
    id: "meadow_species_diversity",
    text: "How many different plant species can you spot?",
    guidance: "Count different types of plants you can see — different leaf shapes, flower colours, and grasses all count as separate species.",
    type: "single_choice",
    options: ["1–3 (low)", "4–8 (moderate)", "9–15 (good)", "16+ (excellent)"],
    required: true,
  },
  {
    id: "meadow_ground_condition",
    text: "Ground condition?",
    guidance: "Press your foot gently into the ground. Does it feel hard, springy, or does water come up?",
    type: "single_choice",
    options: ["Dry/cracked", "Firm", "Soft", "Waterlogged", "Poached/muddy"],
    required: true,
  },
  {
    id: "meadow_wildlife_signs",
    text: "Wildlife signs present?",
    guidance: "Stand still for a moment and watch the vegetation. Look for movement, listen for buzzing and chirping. Select all that apply.",
    type: "multi_choice",
    options: [
      "Butterflies/moths",
      "Bees/pollinators",
      "Birds",
      "Small mammals",
      "Grasshoppers/crickets",
      "None observed",
    ],
    required: true,
  },
  {
    id: "meadow_management",
    text: "Management evidence?",
    guidance: "Look for signs of recent cutting (short stubble, hay bales), grazing (animal droppings, short patches), or neglect.",
    type: "single_choice",
    options: ["Recently mown", "Grazed", "Hay cut", "Unmanaged", "Ploughed"],
    required: true,
  },
  {
    id: "meadow_overall",
    text: "Overall condition",
    guidance: "A healthy meadow has diverse plants, active wildlife, and is neither waterlogged nor bone dry. Rate your overall impression.",
    type: "scale",
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { min: "Poor", max: "Excellent" },
    required: true,
  },
];

const riverQuestions: SurveyQuestion[] = [
  {
    id: "river_flow",
    text: "Water flow?",
    guidance: "Watch a leaf or twig on the surface. Is it stationary, drifting slowly, or moving quickly downstream?",
    type: "single_choice",
    options: ["Dry", "Stagnant", "Slow", "Moderate", "Fast", "Flood/spate"],
    required: true,
  },
  {
    id: "river_water_clarity",
    text: "Water clarity?",
    guidance: "Look into the water at a shallow point. Can you see the riverbed? How far down can you see?",
    type: "single_choice",
    options: ["Clear (see bottom)", "Slightly cloudy", "Murky", "Opaque"],
    required: true,
  },
  {
    id: "river_bank_condition",
    text: "Bank condition (your side)?",
    guidance: "Look at the riverbank nearest to you. Is it covered in vegetation, bare earth, crumbling, or reinforced with concrete?",
    type: "single_choice",
    options: [
      "Natural/vegetated",
      "Eroded",
      "Reinforced/concrete",
      "Poached by livestock",
      "Overgrown",
    ],
    required: true,
  },
  {
    id: "river_channel",
    text: "Channel character?",
    guidance: "Look up and downstream. Riffles are shallow, fast, pebbly sections. Pools are deeper, slower areas. Select all features you can see.",
    type: "multi_choice",
    options: [
      "Riffles",
      "Pools",
      "Meanders",
      "Straight/canalised",
      "Woody debris",
      "Gravel beds",
    ],
    required: true,
  },
  {
    id: "river_pollution_signs",
    text: "Pollution signs?",
    guidance: "Check for unusual smells, discolouration, foam that doesn't pop quickly, oily sheens, or litter. Select all that apply.",
    type: "multi_choice",
    options: [
      "Litter",
      "Sewage smell",
      "Foam/scum",
      "Oil sheen",
      "Discoloured water",
      "Sewage fungus",
      "None",
    ],
    required: true,
  },
  {
    id: "river_wildlife",
    text: "Wildlife observed?",
    guidance: "Watch the water and banks for a minute. Look for fish rising, birds wading or diving, and signs of otters or voles. Select all that apply.",
    type: "multi_choice",
    options: [
      "Fish",
      "Birds (waterbirds)",
      "Invertebrates",
      "Otters/water voles",
      "Kingfisher",
      "None observed",
    ],
    required: true,
  },
  {
    id: "river_overall",
    text: "Overall condition",
    guidance: "Consider water quality, bank condition, habitat diversity, and wildlife together. A healthy river has clear water, natural banks, and visible life.",
    type: "scale",
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { min: "Poor", max: "Excellent" },
    required: true,
  },
];

const woodlandQuestions: SurveyQuestion[] = [
  {
    id: "wood_canopy",
    text: "Canopy cover?",
    guidance: "Look up. How much of the sky is blocked by leaves and branches? Estimate the percentage.",
    type: "single_choice",
    options: ["Open (<25%)", "Partial (25–50%)", "Moderate (50–75%)", "Dense (75%+)"],
    required: true,
  },
  {
    id: "wood_tree_diversity",
    text: "How many tree species can you identify?",
    guidance: "Look at the trees around you. Count different species by leaf shape, bark, or overall form — oak, ash, birch, beech, etc.",
    type: "single_choice",
    options: ["1 (monoculture)", "2–3", "4–6", "7+"],
    required: true,
  },
  {
    id: "wood_understorey",
    text: "Understorey condition?",
    guidance: "The understorey is the layer of shrubs and small trees below the canopy. Can you walk through easily, or is it dense?",
    type: "single_choice",
    options: ["Absent", "Sparse", "Moderate", "Dense", "Impenetrable"],
    required: true,
  },
  {
    id: "wood_ground_flora",
    text: "Ground flora?",
    guidance: "Look at the woodland floor. Is it just leaf litter, or are there ferns, mosses, wildflowers, or bluebells?",
    type: "single_choice",
    options: ["Bare", "Leaf litter only", "Some ground plants", "Rich ground flora", "Bluebells/wild garlic"],
    required: true,
  },
  {
    id: "wood_deadwood",
    text: "Standing and fallen deadwood?",
    guidance: "Deadwood is vital habitat. Look for fallen logs, standing dead trees, and broken branches. More deadwood usually means a healthier woodland.",
    type: "single_choice",
    options: ["None", "Little", "Moderate", "Abundant"],
    required: true,
  },
  {
    id: "wood_condition_signs",
    text: "Any issues?",
    guidance: "Look for dying ash trees (bare crowns), litter dumping, worn paths, or non-native plants like rhododendron. Select all that apply.",
    type: "multi_choice",
    options: [
      "Ash dieback",
      "Storm damage",
      "Litter/dumping",
      "Erosion on paths",
      "Invasive species",
      "None",
    ],
    required: true,
  },
  {
    id: "wood_overall",
    text: "Overall condition",
    guidance: "A healthy woodland has diverse trees, a layered structure (canopy, understorey, ground flora), deadwood, and minimal damage.",
    type: "scale",
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { min: "Poor", max: "Excellent" },
    required: true,
  },
];

const vergeQuestions: SurveyQuestion[] = [
  {
    id: "verge_width",
    text: "Approximate width?",
    guidance: "Estimate the width of the grass verge from the road edge to the boundary (fence, hedge, or building).",
    type: "single_choice",
    options: ["Narrow (<1m)", "Medium (1–2m)", "Wide (2–4m)", "Very wide (4m+)"],
    required: true,
  },
  {
    id: "verge_vegetation_height",
    text: "Vegetation height?",
    guidance: "What is the general height of the grass and plants? Ignore any recently mown edges.",
    type: "single_choice",
    options: ["Short (under 10cm)", "Medium (10–30cm)", "Tall (30cm+)"],
    required: true,
  },
  {
    id: "verge_wildflowers",
    text: "Wildflower presence?",
    guidance: "Look for any flowering plants that aren't grass — daisies, dandelions, clover, cow parsley, or anything more unusual.",
    type: "single_choice",
    options: ["None", "Sparse", "Moderate", "Abundant"],
    required: true,
  },
  {
    id: "verge_management",
    text: "Recent management?",
    guidance: "Has the verge been recently cut (short stubble), left to grow, or show signs of herbicide use (brown/dead patches)?",
    type: "single_choice",
    options: ["Freshly mown", "Mown (growing back)", "Unmown", "Sprayed/dead patches"],
    required: true,
  },
  {
    id: "verge_condition_issues",
    text: "Any issues?",
    guidance: "Check for litter, tyre tracks, salt damage from winter gritting, or places where tarmac/gravel has spread onto the verge. Select all that apply.",
    type: "multi_choice",
    options: [
      "Litter",
      "Vehicle damage/rutting",
      "Salt damage",
      "Dog fouling",
      "Invasive species",
      "Encroachment (tarmac/gravel)",
      "None",
    ],
    required: true,
  },
  {
    id: "verge_overall",
    text: "Overall condition",
    guidance: "Consider the width, wildflower presence, management, and any damage together. A healthy verge supports pollinators and biodiversity.",
    type: "scale",
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: { min: "Poor", max: "Excellent" },
    required: true,
  },
];

export const SURVEY_SCHEMAS: Record<SiteType, SurveySchema> = {
  pond: { siteType: "pond", version: 1, questions: pondQuestions },
  hedgerow: { siteType: "hedgerow", version: 1, questions: hedgerowQuestions },
  meadow: { siteType: "meadow", version: 1, questions: meadowQuestions },
  river: { siteType: "river", version: 1, questions: riverQuestions },
  woodland: { siteType: "woodland", version: 1, questions: woodlandQuestions },
  verge: { siteType: "verge", version: 1, questions: vergeQuestions },
};
