import { Tool, Category } from '../types';
import { tools } from '../data/tools';
import { categories as categoryData } from '../data/categories';
import { contentTranslations, ContentTranslationMap } from '../data/content-translations';
import { Language } from '../translations';

function applyToolTranslations(tool: Tool, map: ContentTranslationMap): Tool {
  const prefix = `tool_${tool.id}`;

  const translatedInputs = tool.inputs.map(input => {
    const label = map[`${prefix}_input_${input.id}_label`] || input.label;
    const placeholder = map[`${prefix}_input_${input.id}_placeholder`] || input.placeholder;
    const options = input.options?.map(opt => ({
      ...opt,
      label: map[`${prefix}_input_${input.id}_option_${opt.value}`] || opt.label
    }));
    return { ...input, label, placeholder, options };
  });

  const translatedExample: Record<string, string> = {};
  for (const key of Object.keys(tool.exampleInput)) {
    translatedExample[key] = map[`${prefix}_example_${key}`] || tool.exampleInput[key];
  }

  return {
    ...tool,
    title: map[`${prefix}_title`] || tool.title,
    description: map[`${prefix}_desc`] || tool.description,
    inputs: translatedInputs,
    exampleInput: translatedExample
  };
}

export function getLocalizedTools(language: Language): Tool[] {
  const map = contentTranslations[language] || {};
  if (language === 'ar') return tools;
  return tools.map(t => applyToolTranslations(t, map));
}

export function getLocalizedCategories(language: Language): Category[] {
  const map = contentTranslations[language] || {};
  if (language === 'ar') return categoryData;
  return categoryData.map(cat => ({
    ...cat,
    name: map[`cat_${cat.id}_name`] || cat.name,
    description: map[`cat_${cat.id}_desc`] || cat.description
  }));
}
