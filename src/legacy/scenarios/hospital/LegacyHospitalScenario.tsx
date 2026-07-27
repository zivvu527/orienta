import React from 'react';
import { hospitalCategoryLabels, hospitalPhrases } from './hospitalPhrases';
import type { Phrase } from '../../../data/types';

type MedicalInfo = {
  symptoms: string[];
  started: string;
  painLevel: string;
  notes: string;
};

type AllergyInfo = {
  drugAllergies: string;
  foodAllergies: string;
  medication: string;
};

export const legacyHospitalScope = {
  reason:
    'Archived because Hospital is outside the Backpack in China MVP risk boundary.',
  tools: [
    'Urgent Help',
    'Describe Symptoms',
    'Allergies and Medication',
    'Registration Help',
    'Hospital Phrases',
  ],
  categoryLabels: hospitalCategoryLabels,
  phrases: hospitalPhrases,
};

export function createLegacyMedicalSummary(info: MedicalInfo): Phrase {
  return {
    id: 'medical-summary',
    category: 'hospital',
    english: `${info.symptoms.join(', ')}. It started ${info.started || 'recently'}. Pain level: ${info.painLevel || '?'} / 10.${info.notes ? ` Notes: ${info.notes}` : ''}`,
    chinese: `症状：${info.symptoms.join('，')}。\n开始时间：${info.started || '最近'}。\n疼痛程度：${info.painLevel || '?'}分（满分10分）。${info.notes ? `\n补充说明：${info.notes}` : ''}`,
  };
}

export function createLegacyAllergySummary(info: AllergyInfo): Phrase {
  return {
    id: 'allergy-summary',
    category: 'hospital',
    english: `Drug allergies: ${info.drugAllergies || 'None listed'}. Food allergies: ${info.foodAllergies || 'None listed'}. Current medication: ${info.medication || 'None listed'}.`,
    chinese: `药物过敏：${info.drugAllergies || '没有填写'}。\n食物过敏：${info.foodAllergies || '没有填写'}。\n正在服用的药：${info.medication || '没有填写'}。`,
  };
}

export function LegacyHospitalScenarioNote() {
  return (
    <section>
      <h1>Legacy Hospital Scenario</h1>
      <p>This archived prototype is not imported by the active MVP.</p>
    </section>
  );
}
