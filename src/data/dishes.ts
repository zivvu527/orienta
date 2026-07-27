export type Dish = {
  id: string;
  keywords: string[];
  chineseName: string;
  englishName: string;
  whatItIs: string;
  ingredients: string;
  taste: string;
  spiciness: string;
  allergens: string;
  region: string;
  vegetarian: string;
};

export const mockDishes: Dish[] = [
  {
    id: 'mapo-tofu',
    keywords: ['mapo', 'tofu', '麻婆豆腐'],
    chineseName: '麻婆豆腐',
    englishName: 'Mapo Tofu',
    whatItIs: 'Soft tofu in a rich sauce, often cooked with minced meat.',
    ingredients: 'Tofu, chili bean paste, Sichuan pepper, minced meat.',
    taste: 'Savory, spicy, and numbing.',
    spiciness: 'High',
    allergens: 'Soy. Often contains meat.',
    region: 'Sichuan',
    vegetarian: 'Usually no, unless made without meat.',
  },
  {
    id: 'hot-pot',
    keywords: ['hot pot', 'huoguo', '火锅'],
    chineseName: '火锅',
    englishName: 'Hot Pot',
    whatItIs: 'A shared pot of broth where you cook ingredients at the table.',
    ingredients: 'Meat, vegetables, tofu, noodles, broth, and dipping sauces.',
    taste: 'Can be mild, spicy, numbing, or savory.',
    spiciness: 'Varies',
    allergens: 'Depends on broth and sauces. Ask staff if needed.',
    region: 'Popular across China',
    vegetarian: 'Possible with vegetarian broth and ingredients.',
  },
  {
    id: 'kung-pao-chicken',
    keywords: ['kung pao', 'gongbao', '宫保鸡丁'],
    chineseName: '宫保鸡丁',
    englishName: 'Kung Pao Chicken',
    whatItIs: 'Stir-fried diced chicken with peanuts, chili, and a savory-sweet sauce.',
    ingredients: 'Chicken, peanuts, dried chili, scallions, soy-based sauce.',
    taste: 'Savory, slightly sweet, nutty, mildly spicy.',
    spiciness: 'Medium',
    allergens: 'Peanuts, soy.',
    region: 'Sichuan-inspired',
    vegetarian: 'No.',
  },
  {
    id: 'beijing-roast-duck',
    keywords: ['duck', 'peking duck', 'beijing roast duck', '北京烤鸭'],
    chineseName: '北京烤鸭',
    englishName: 'Beijing Roast Duck',
    whatItIs: 'Crispy roasted duck usually served with thin pancakes and sauce.',
    ingredients: 'Duck, pancakes, scallions, cucumber, sweet bean sauce.',
    taste: 'Rich, savory, slightly sweet.',
    spiciness: 'None',
    allergens: 'Wheat in pancakes, soy in sauce.',
    region: 'Beijing',
    vegetarian: 'No.',
  },
  {
    id: 'xiaolongbao',
    keywords: ['xiaolongbao', 'soup dumpling', '小笼包'],
    chineseName: '小笼包',
    englishName: 'Xiaolongbao',
    whatItIs: 'Steamed dumplings filled with meat and hot soup.',
    ingredients: 'Wheat wrapper, pork or other filling, broth.',
    taste: 'Savory and juicy.',
    spiciness: 'None',
    allergens: 'Wheat. Usually contains pork.',
    region: 'Jiangnan / Shanghai area',
    vegetarian: 'Usually no.',
  },
];
