import { SupportedLanguage } from '@/context/LanguageContext'

// Common Regulatory Status Translations
export const STATUS_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: { Approved: 'Approved', Restricted: 'Restricted', Banned: 'Banned' },
  hi: { Approved: 'स्वीकृत (Approved)', Restricted: 'प्रतिबंधित / सीमित', Banned: 'पूर्ण प्रतिबंधित (Banned)' },
  es: { Approved: 'Aprobado', Restricted: 'Restringido', Banned: 'Prohibido' },
  fr: { Approved: 'Approuvé', Restricted: 'Restreint', Banned: 'Interdit' },
  de: { Approved: 'Zugelassen', Restricted: 'Eingeschränkt', Banned: 'Verboten' },
  zh: { Approved: '已批准', Restricted: '受限使用', Banned: '已禁用' },
  ar: { Approved: 'معتمد', Restricted: 'مقيد', Banned: 'محظور' },
  ja: { Approved: '認可済み', Restricted: '制限あり', Banned: '禁止' },
  pt: { Approved: 'Aprovado', Restricted: 'Restrito', Banned: 'Proibido' },
  ru: { Approved: 'Одобрено', Restricted: 'Ограничено', Banned: 'Запрещено' },
  it: { Approved: 'Approvato', Restricted: 'Limitato', Banned: 'Vietato' },
  bn: { Approved: 'অনুমোদিত', Restricted: 'সীমাবদ্ধ', Banned: 'নিষিদ্ধ' },
}

// Common Verdict Translations
export const VERDICT_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: { 'Safe': 'Safe', 'Moderate Risk': 'Moderate Risk', 'High Risk': 'High Risk', 'Critical Risk': 'Critical Risk', 'Unknown': 'Unknown' },
  hi: { 'Safe': 'सुरक्षित', 'Moderate Risk': 'मध्यम जोखिम', 'High Risk': 'उच्च जोखिम', 'Critical Risk': 'गंभीर जोखिम', 'Unknown': 'अज्ञात' },
  es: { 'Safe': 'Seguro', 'Moderate Risk': 'Riesgo Moderado', 'High Risk': 'Alto Riesgo', 'Critical Risk': 'Riesgo Crítico', 'Unknown': 'Desconocido' },
  fr: { 'Safe': 'Sûr', 'Moderate Risk': 'Risque Modéré', 'High Risk': 'Risque Élevé', 'Critical Risk': 'Risque Critique', 'Unknown': 'Inconnu' },
  de: { 'Safe': 'Sicher', 'Moderate Risk': 'Mäßiges Risiko', 'High Risk': 'Hohes Risiko', 'Critical Risk': 'Kritisches Risiko', 'Unknown': 'Unbekannt' },
  zh: { 'Safe': '安全', 'Moderate Risk': '中度风险', 'High Risk': '高风险', 'Critical Risk': '极高风险', 'Unknown': '未知' },
  ar: { 'Safe': 'آمن', 'Moderate Risk': 'مخاطر متوسطة', 'High Risk': 'عالي الخطورة', 'Critical Risk': 'مخاطر حرجة', 'Unknown': 'غير معروف' },
  ja: { 'Safe': '安全', 'Moderate Risk': '中リスク', 'High Risk': '高リスク', 'Critical Risk': '極めて危険', 'Unknown': '不明' },
  pt: { 'Safe': 'Seguro', 'Moderate Risk': 'Risco Moderado', 'High Risk': 'Alto Risco', 'Critical Risk': 'Risco Crítico', 'Unknown': 'Desconhecido' },
  ru: { 'Safe': 'Безопасно', 'Moderate Risk': 'Умеренный риск', 'High Risk': 'Высокий риск', 'Critical Risk': 'Критический риск', 'Unknown': 'Неизвестно' },
  it: { 'Safe': 'Sicuro', 'Moderate Risk': 'Rischio Moderato', 'High Risk': 'Alto Rischio', 'Critical Risk': 'Rischio Critico', 'Unknown': 'Sconosciuto' },
  bn: { 'Safe': 'নিরাপদ', 'Moderate Risk': 'মাঝারি ঝুঁকি', 'High Risk': 'উচ্চ ঝুঁকি', 'Critical Risk': 'মারাত্মক ঝুঁকি', 'Unknown': 'অজানা' },
}

// Country Names
export const COUNTRY_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: { 'United States': 'United States', 'European Union': 'European Union', 'India': 'India', 'Norway': 'Norway', 'United Kingdom': 'United Kingdom', 'Canada': 'Canada', 'Japan': 'Japan' },
  hi: { 'United States': 'संयुक्त राज्य अमेरिका (USA)', 'European Union': 'यूरोपीय संघ (EU)', 'India': 'भारत (India)', 'Norway': 'नॉर्वे', 'United Kingdom': 'ब्रिटेन', 'Canada': 'कनाडा', 'Japan': 'जापान' },
  es: { 'United States': 'Estados Unidos', 'European Union': 'Unión Europea', 'India': 'India', 'Norway': 'Noruega', 'United Kingdom': 'Reino Unido', 'Canada': 'Canadá', 'Japan': 'Japón' },
  fr: { 'United States': 'États-Unis', 'European Union': 'Union Européenne', 'India': 'Inde', 'Norway': 'Norvège', 'United Kingdom': 'Royaume-Uni', 'Canada': 'Canada', 'Japan': 'Japon' },
  de: { 'United States': 'Vereinigte Staaten', 'European Union': 'Europäische Union', 'India': 'Indien', 'Norway': 'Norwegen', 'United Kingdom': 'Vereinigtes Königreich', 'Canada': 'Kanada', 'Japan': 'Japan' },
  zh: { 'United States': '美国', 'European Union': '欧盟', 'India': '印度', 'Norway': '挪威', 'United Kingdom': '英国', 'Canada': '加拿大', 'Japan': '日本' },
  ar: { 'United States': 'الولايات المتحدة', 'European Union': 'الاتحاد الأوروبي', 'India': 'الهند', 'Norway': 'النرويج', 'United Kingdom': 'المملكة المتحدة', 'Canada': 'كندا', 'Japan': 'اليابان' },
  ja: { 'United States': 'アメリカ', 'European Union': '欧州連合 (EU)', 'India': 'インド', 'Norway': 'ノルウェー', 'United Kingdom': 'イギリス', 'Canada': 'カナダ', 'Japan': '日本' },
  pt: { 'United States': 'Estados Unidos', 'European Union': 'União Europeia', 'India': 'Índia', 'Norway': 'Noruega', 'United Kingdom': 'Reino Unido', 'Canada': 'Canadá', 'Japan': 'Japão' },
  ru: { 'United States': 'США', 'European Union': 'Европейский Союз', 'India': 'Индия', 'Norway': 'Норвегия', 'United Kingdom': 'Великобритания', 'Canada': 'Канада', 'Japan': 'Япония' },
  it: { 'United States': 'Stati Uniti', 'European Union': 'Unione Europea', 'India': 'India', 'Norway': 'Norvegia', 'United Kingdom': 'Regno Unito', 'Canada': 'Canada', 'Japan': 'Giappone' },
  bn: { 'United States': 'মার্কিন যুক্তরাষ্ট্র', 'European Union': 'ইউরোপীয় ইউনিয়ন', 'India': 'ভারত', 'Norway': 'নরওয়ে', 'United Kingdom': 'যুক্তরাজ্য', 'Canada': 'কানাডা', 'Japan': 'জাপান' },
}

// Dynamic phrase & text dictionary across languages
const CONTENT_DICTIONARY: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  // Coca Cola AI Summary
  'This product is a highly processed beverage with a poor nutritional profile, characterized by high levels of added sugars or high-fructose corn syrup which contribute to metabolic issues. It contains phosphoric acid and caffeine, which pose risks to dental health, bone density, and sleep quality. Regular consumption is strongly discouraged due to its association with obesity, type 2 diabetes, and cardiovascular risks.': {
    hi: 'यह उत्पाद एक अत्यधिक प्रसंस्कृत (ultra-processed) पेय है जिसमें पोषण की भारी कमी है। इसमें अत्यधिक मात्रा में अतिरिक्त चीनी या हाई-फ्रुक्टोज कॉर्न सिरप पाया जाता है जो चयापचय (metabolic) समस्याओं का कारण बनता है। इसमें फॉस्फोरिक एसिड और कैफीन शामिल हैं, जो दांतों के इनेमल, हड्डियों के घनत्व और नींद की गुणवत्ता के लिए हानिकारक हैं। मोटापे, टाइप 2 मधुमेह और हृदय रोगों के जोखिम के कारण इसके नियमित सेवन से बचने की सख्त सलाह दी जाती है।',
    es: 'Este producto es una bebida altamente procesada con un perfil nutricional deficiente, caracterizado por altos niveles de azúcares añadidos o jarabe de maíz de alta fructosa que contribuyen a problemas metabólicos. Contiene ácido fosfórico y cafeína, que presentan riesgos para la salud dental, la densidad ósea y el sueño. Se desaconseja firmemente el consumo regular.',
    fr: 'Ce produit est une boisson ultra-transformée au profil nutritionnel médiocre, caractérisée par des niveaux élevés de sucres ajoutés ou de sirop de maïs à haute teneur en fructose. Il contient de l\'acide phosphorique et de la caféine, présentant des risques pour l\'émail dentaire et la santé osseuse. Une consommation régulière est fortement déconseillée.',
    de: 'Dieses Produkt ist ein hochverarbeitetes Getränk mit schlechtem Nährwertprofil und hohem Zuckergehalt. Es enthält Phosphorsäure und Koffein, was Risiken für Zähne und Knochendichte birgt. Vom regelmäßigen Verzehr wird dringend abgeraten.',
    zh: '该产品属于超加工饮料，营养价值极低，含有大量添加糖或高果糖玉米糖浆，易导致代谢异常。所含磷酸和咖啡因会损害牙齿健康及骨密度。强烈建议避免长期饮用。',
    ar: 'هذا المنتج عبارة عن مشروب فائق المعالجة ذو قيمة غذائية ضعيفة، ويحتوي على مستويات عالية من السكريات المضافة أو شراب الذرة عالي الفركتوز. كما يحتوي على حمض الفوسفوريك والكافيين. ينصح بشدة بتجنب الاستهلاك المنتظم.',
    ja: '本製品は栄養価の低い超加工飲料であり、大量の添加糖や高果糖コーンシロップを含んでいます。リン酸やカフェインも含まれ、歯のエナメル質や骨密度への影響が懸念されます。日常的な摂取は控えることを強く推奨します。',
    pt: 'Este produto é uma bebida altamente processada com perfil nutricional fraco, rica em açúcares adicionados e xarope de milho. Contém ácido fosfórico e cafeína. O consumo regular é fortemente desaconselhado.',
    ru: 'Этот продукт представляет собой ультрапереработанный напиток с низкой питательной ценностью и высоким содержанием добавленного сахара. Содержит фосфорную кислоту и кофеин. Регулярное употребление настоятельно не рекомендуется.',
    it: 'Questo prodotto è una bevanda ultra-processata con uno scarso profilo nutrizionale e un elevato contenuto di zuccheri aggiunti. Contiene acido fosforico e caffeina. Il consumo regolare è fortemente sconsigliato.',
    bn: 'এই পণ্যটি একটি অতি-প্রক্রিয়াজাত পানীয় যার পুষ্টিমান অত্যন্ত নিম্ন। এতে প্রচুর পরিমাণে চিনি বা হাই-ফ্রুক্টোজ কর্ন সিরাপ রয়েছে যা মেটাবলিক সমস্যা সৃষ্টি করে। এতে ফসফরিক অ্যাসিড ও ক্যাফেইন থাকায় দাঁত ও হাড়ের ক্ষতি হতে পারে। নিয়মিত পান করা থেকে বিরত থাকার পরামর্শ দেওয়া হচ্ছে।'
  },

  // Beef Jerky Summary
  'This product contains one high-risk preservative (Sodium Nitrite) that forms nitrosamines under high heat, and one moderate-risk synthetic dye (Tartrazine). Most remaining ingredients, including Citric Acid, are well-tolerated. Consider a nitrate-free alternative if you eat cured meats frequently.': {
    hi: 'इस उत्पाद में एक उच्च जोखिम वाला परिरक्षक (सोडियम नाइट्राइट) है जो उच्च तापमान पर नाइट्रोसामाइन बनाता है, और एक मध्यम जोखिम वाला कृत्रिम रंग (टार्ट्राज़िन) है। यदि आप अक्सर प्रसंस्कृत मांस खाते हैं, तो नाइट्रेट-मुक्त विकल्प चुनने पर विचार करें।',
    es: 'Este producto contiene un conservante de alto riesgo (nitrito de sodio) que forma nitrosaminas a altas temperaturas y un colorante sintético de riesgo moderado (tartrazina). Considere una alternativa sin nitratos si come carnes curadas con frecuencia.',
    fr: 'Ce produit contient un conservateur à haut risque (nitrite de sodium) et un colorant synthétique à risque modéré (tartrazine). Envisagez une alternative sans nitrate si vous consommez régulièrement des charcuteries.',
    de: 'Dieses Produkt enthält ein Konservierungsmittel mit hohem Risiko (Natriumnitrit) und einen synthetischen Farbstoff (Tartrazin). Wählen Sie eine nitratfreie Alternative.',
    zh: '该产品含有一种高风险防腐剂（亚硝酸钠）和一种中度风险合成色素（柠檬黄）。建议经常食用腌制肉类的人群选择无亚硝酸盐替代品。',
    ar: 'يحتوي هذا المنتج على مادة حافظة عالية الخطورة (نتريت الصوديوم) وصبغة صناعية متوسطة الخطورة (تارترازين). يفضل اختيار بديل خالٍ من النترات.',
    ja: '本製品には高リスク保存料（亜硝酸ナトリウム）および合成着色料（タートラジン）が含まれています。頻繁に召し上がる場合は無塩せき（硝酸塩不使用）製品をご検討ください。',
    pt: 'Este produto contém nitrito de sódio e corante sintético tartrazina. Considere alternativas sem nitratos.',
    ru: 'Этот продукт содержит нитрит натрия и синтетический краситель тартразин. Рекомендуется выбирать альтернативы без нитратов.',
    it: 'Questo prodotto contiene nitrito di sodio e il colorante sintetico tartrazina. Si consiglia un\'alternativa senza nitrati.',
    bn: 'এই পণ্যটিতে সোডিয়াম নাইট্রাইট এবং সিন্থেটিক রং টারট্রাজিন রয়েছে। নিয়মিত খাওয়ার ক্ষেত্রে নাইট্রাইট-মুক্ত বিকল্প বেছে নেওয়ার পরামর্শ দেওয়া হচ্ছে।'
  },

  // Turkey Jerky Summary
  'This product uses celery powder as a natural nitrate source instead of synthetic sodium nitrite, and contains no artificial dyes. Overall a substantially safer option for regular consumption.': {
    hi: 'यह उत्पाद सिंथेटिक सोडियम नाइट्राइट के बजाय प्राकृतिक अजवाइन पाउडर (celery powder) का उपयोग करता है और इसमें कोई कृत्रिम रंग नहीं है। नियमित उपभोग के लिए यह काफी सुरक्षित विकल्प है।',
    es: 'Este producto utiliza polvo de apio como fuente natural de nitratos en lugar de nitrito de sodio sintético y no contiene colorantes artificiales. Una opción sustancialmente más segura.',
    fr: 'Ce produit utilise de la poudre de céleri comme source naturelle de nitrate sans colorants artificiels. Une option nettement plus sûre.',
    de: 'Dieses Produkt verwendet Selleriepulver als natürliche Nitratquelle ohne künstliche Farbstoffe. Eine deutlich sicherere Wahl.',
    zh: '该产品使用芹菜粉作为天然硝酸盐来源，不含人工色素，是更加安全健康的选择。',
    ar: 'يستخدم هذا المنتج مسحوق الكرفس كمصدر طبيعي للنترات وبدون أصباغ اصطناعية، مما يجعله خيارًا أكثر أمانًا.',
    ja: '本製品は合成亜硝酸ナトリウムの代わりに天然のセロリパウダーを使用しており、人工着色料も含みません。安全性の高い選択肢です。',
    pt: 'Este produto utiliza extrato natural de aipo e não possui corantes artificiais, sendo uma opção muito mais saudável.',
    ru: 'Этот продукт использует порошок сельдерея вместо синтетических нитритов и не содержит искусственных красителей. Безопасный выбор.',
    it: 'Questo prodotto utilizza polvere di sedano come fonte naturale di nitrati senza coloranti sintetici. Un\'opzione molto più sicura.',
    bn: 'এই পণ্যটিতে সিন্থেটিক নাইট্রাইটের পরিবর্তে প্রাকৃতিক সেলারি পাউডার ব্যবহার করা হয়েছে এবং কোনও কৃত্রিম রং নেই।'
  },

  // Maggi / Noodles Summary
  'Contains refined wheat flour (Maida), palm oil with high saturated fats, hydrolyzed peanut protein, and flavor enhancer monosodium glutamate (MSG). Regular consumption may elevate sodium and lipid levels.': {
    hi: 'इसमें परिष्कृत गेहूं का आटा (मैदा), उच्च संतृप्त वसा वाला पाम तेल और मोनोसोडियम ग्लूटामेट (MSG) शामिल हैं। अत्यधिक सेवन से सोडियम और लिपिड का स्तर बढ़ सकता है।',
    es: 'Contiene harina refinada, aceite de palma con alto contenido de grasas saturadas y glutamato monosódico (GMS). Su consumo frecuente puede elevar los niveles de sodio.',
    fr: 'Contient de la farine de blé raffinée, de l\'huile de palme riche en graisses saturées et du glutamate monosodique (MSG).',
    de: 'Enthält raffiniertes Weizenmehl, Palmöl mit gesättigten Fettsäuren und Geschmacksverstärker Glutamat (MSG).',
    zh: '含有精制小麦粉、富含饱和脂肪的棕榈油以及谷氨酸钠（味精）。长期食用可能会增加钠摄入量。',
    ar: 'يحتوي على دقيق القمح المكرر، زيت النخيل الغني بالدهون المشبعة، ومحسن النكهة أحادي جلوتامات الصوديوم (MSG).',
    ja: '精製小麦粉、飽和脂肪酸の多いパーム油、調味料（グルタミン酸ナトリウム）を含んでいます。',
    pt: 'Contém farinha refinada, óleo de palma rico em gorduras saturadas e realçador de sabor glutamato monossódico.',
    ru: 'Содержит рафинированную муку, пальмовое масло и глутамат натрия (MSG).',
    it: 'Contiene farina di grano raffinata, olio di palma ricco di grassi saturi e glutammato monosodico (MSG).',
    bn: 'এতে পরিশোধিত ময়দা, পাম তেল এবং স্বাদবর্ধক মনোসোডিয়াম গ্লুটামেট (টেস্টিং সল্ট) রয়েছে।'
  },

  // Carbonated water reason
  'Non-toxic and safe for consumption, though carbonation can cause mild bloating.': {
    hi: 'गैर-विषैला और उपभोग के लिए सुरक्षित, हालांकि कार्बोनेशन से हल्का पेट फूलना (bloating) हो सकता है।',
    es: 'No tóxico y seguro para el consumo, aunque la carbonatación puede causar ligera hinchazón.',
    fr: 'Non toxique et sans danger, bien que la gazéification puisse causer de légers ballonnements.',
    de: 'Ungiftig und sicher im Verzehr; Kohlensäure kann leichte Blähungen verursachen.',
    zh: '无毒且可安全食用，但碳酸气泡可能会引起轻微腹胀。',
    ar: 'غير سام وآمن للاستهلاك، على الرغم من أن الكربنة قد تسبب انتفاخًا خفيفًا.',
    ja: '無毒で安全に摂取可能ですが、炭酸ガスにより軽い膨満感が生じる場合があります。',
    pt: 'Não tóxico e seguro para consumo, embora a carbonatação possa causar leve inchaço.',
    ru: 'Нетоксично и безопасно, хотя газирование может вызывать легкое вздутие живота.',
    it: 'Non tossico e sicuro per il consumo, anche se la gasatura può causare lieve gonfiore.',
    bn: 'অ-বিষাক্ত এবং খাওয়ার জন্য সম্পূর্ণ নিরাপদ, তবে অতিরিক্ত কার্বোনেশনে সামান্য পেট ফাঁপতে পারে।'
  },

  // Sugar reason
  'High glycemic index, contributes to obesity, type 2 diabetes, fatty liver disease, and dental caries.': {
    hi: 'उच्च ग्लाइसेमिक इंडेक्स, मोटापे, टाइप 2 मधुमेह, फैटी लिवर रोग और दांतों में सड़न को बढ़ावा देता है।',
    es: 'Alto índice glucémico, contribuye a la obesidad, diabetes tipo 2, hígado graso y caries dental.',
    fr: 'Indice glycémique élevé, contribue à l\'obésité, au diabète de type 2, à la stéatose hépatique et aux caries dentaires.',
    de: 'Hoher glykämischer Index, trägt zu Fettleibigkeit, Typ-2-Diabetes, Fettleber und Karies bei.',
    zh: '高升糖指数，长期过量摄入会导致肥胖、2型糖尿病、脂肪肝及龋齿。',
    ar: 'مؤشر جلايسيمي مرتفع، يساهم في السمنة ومرض السكري من النوع 2 وأمراض الكبد الدهني وتسوس الأسنان.',
    ja: '高グリセミック指数。肥満、2型糖尿病、脂肪肝、虫歯のリスクを高めます。',
    pt: 'Alto índice glicêmico, contribui para obesidade, diabetes tipo 2, fígado gorduroso e cáries.',
    ru: 'Высокий гликемический индекс, способствует ожирению, диабету 2 типа, жировому гепатозу и кариесу.',
    it: 'Alto indice glicemico, favorisce obesità, diabete di tipo 2, fegato grasso e carie dentaria.',
    bn: 'উচ্চ গ্লাইসেমিক সূচক; স্থূলতা, টাইপ ২ ডায়াবেটিস, ফ্যাটি লিভার এবং দাঁতের ক্ষয় বাড়ায়।'
  },

  // Caramel Color Reason
  'Class IV caramel color contains 4-methylimidazole (4-MEI), a potential carcinogen in high doses.': {
    hi: 'क्लास IV कैरेमल रंग में 4-मिथाइलइमिडाजोल (4-MEI) होता है, जो उच्च मात्रा में संभावित कैंसरकारी तत्व है।',
    es: 'El colorante caramelo clase IV contiene 4-metilimidazol (4-MEI), un posible carcinógeno en dosis altas.',
    fr: 'Le colorant caramel de classe IV contient du 4-méthylimidazole (4-MEI), un cancérogène potentiel à forte dose.',
    de: 'Klasse-IV-Zuckerkulör enthält 4-Methylimidazol (4-MEI), einen potenziellen Krebserreger in hohen Dosen.',
    zh: 'IV类焦糖色素含有4-甲基咪唑（4-MEI），在高剂量下具有潜在致癌性。',
    ar: 'يحتوي لون الكراميل من الفئة الرابعة على 4-ميثيل إيميدازول، وهو مادة مسرطنة محتملة بجرعات عالية.',
    ja: 'クラスIVカラメル色素には4-メチルイミダゾール（4-MEI）が含まれ、高用量で発がん性の懸念があります。',
    pt: 'O corante caramelo IV contém 4-metilimidazol (4-MEI), potencial carcinogênico em altas doses.',
    ru: 'Карамельный краситель IV класса содержит 4-метилимидазол (4-MEI), потенциальный канцероген в высоких дозах.',
    it: 'Il colorante caramello di classe IV contiene 4-metilimidazolo (4-MEI), potenziale cancerogeno ad alte dosi.',
    bn: 'ক্লাস ৪ ক্যারামেল রঙে ৪-মিথাইলইমিডাজল (4-MEI) থাকে যা উচ্চ মাত্রায় সম্ভাব্য কার্সিনোজেন বা ক্যান্সার সৃষ্টিকারী।'
  },

  // Phosphoric acid reason
  'Can erode tooth enamel and is linked to lower bone density and kidney stones with chronic intake.': {
    hi: 'दांतों के इनेमल को नष्ट कर सकता है और दीर्घकालिक सेवन से हड्डियों के घनत्व में कमी और गुर्दे की पथरी से जुड़ा है।',
    es: 'Puede erosionar el esmalte dental y está relacionado con una menor densidad ósea y cálculos renales.',
    fr: 'Peut éroder l\'émail dentaire et est associé à une baisse de la densité osseuse et aux calculs rénaux.',
    de: 'Kann den Zahnschmelz angreifen und wird mit verringerter Knochendichte und Nierensteinen in Verbindung gebracht.',
    zh: '会腐蚀牙齿釉质，长期摄入与骨密度降低和肾结石风险增加相关。',
    ar: 'يمكن أن يؤدي إلى تآكل مينا الأسنان ويرتبط بانخفاض كثافة العظام وحصوات الكلى.',
    ja: '歯のエナメル質を侵食し、長期的な摂取は骨密度の低下や腎臓結石と関連しています。',
    pt: 'Pode corroer o esmalte dentário e está associado à perda de densidade óssea e pedras nos rins.',
    ru: 'Может разрушать зубную эмаль и связано со снижением плотности костей и образованием камней в почках.',
    it: 'Può erodere lo smalto dentale ed è collegato a una minore densità ossea e calcoli renali.',
    bn: 'দাঁতের এনামেল ক্ষয় করতে পারে এবং দীর্ঘমেয়াদে হাড়ের ঘনত্ব হ্রাস ও কিডনিতে পাথরের ঝুঁকি তৈরি করে।'
  },

  // Caffeine reason
  'Central nervous system stimulant; can cause insomnia, anxiety, elevated heart rate, and dependency.': {
    hi: 'केंद्रीय तंत्रिका तंत्र उत्तेजक; अनिद्रा, चिंता, दिल की धड़कन बढ़ना और निर्भरता का कारण बन सकता है।',
    es: 'Estimulante del sistema nervioso central; puede causar insomnio, ansiedad y taquicardia.',
    fr: 'Stimulant du système nerveux central ; peut causer insomnie, anxiété et accélération du rythme cardiaque.',
    de: 'Zentrales Nervensystem-Stimulans; kann Schlaflosigkeit, Angstzustände und Herzrasen verursachen.',
    zh: '中枢神经系统兴奋剂；可能引起失眠、焦虑、心率加快和依赖性。',
    ar: 'منبه للجهاز العصبي المركزي؛ قد يسبب الأرق والقلق وسرعة ضربات القلب.',
    ja: '中枢神経刺激物質。不眠、不安、心拍数増加、依存を引き起こす可能性があります。',
    pt: 'Estimulante do sistema nervoso central; pode causar insônia, ansiedade e taquicardia.',
    ru: 'Стимулятор центральной нервной системы; может вызывать бессонницу, тревожность и тахикардию.',
    it: 'Stimolante del sistema nervoso centrale; può causare insonnia, ansia e tachicardia.',
    bn: 'কেন্দ্রীয় স্নায়ুতন্ত্রের উদ্দীপক; অনিদ্রা, উদ্বেগ এবং হৃদস্পন্দন বৃদ্ধির কারণ হতে পারে।'
  },

  // Sodium Nitrite Reason
  'Linked to nitrosamine formation when cooked at high heat': {
    hi: 'उच्च तापमान पर पकाने पर कैंसरकारी नाइट्रोसामाइन के निर्माण से जुड़ा है',
    es: 'Relacionado con la formación de nitrosaminas al cocinarse a altas temperaturas',
    fr: 'Lié à la formation de nitrosamines lors de la cuisson à haute température',
    de: 'Mit der Bildung von Nitrosaminen bei hoher Hitze verbunden',
    zh: '高温烹饪时易生成具有致癌风险的亚硝胺',
    ar: 'مرتبط بتكوين النيتروزامين المسرطن عند الطهي في درجات حرارة عالية',
    ja: '高温加熱時に発がん性ニトロソアミンを生成するリスクがあります',
    pt: 'Associado à formação de nitrosaminas sob altas temperaturas',
    ru: 'Связано с образованием канцерогенных нитрозаминов при нагревании',
    it: 'Associato alla formazione di nitrosammine durante la cottura ad alte temperature',
    bn: 'উচ্চ তাপে রান্না করার সময় ক্ষতিকর নাইট্রোসামাইন গঠনের সাথে সম্পর্কিত'
  },

  // Tartrazine Reason
  'Synthetic dye linked to hyperactivity in sensitive children': {
    hi: 'सिंथेटिक रंग जो संवेदनशील बच्चों में अतिसक्रियता (hyperactivity) से जुड़ा है',
    es: 'Colorante sintético vinculado a la hiperactividad en niños sensibles',
    fr: 'Colorant synthétique lié à l\'hyperactivité chez les enfants sensibles',
    de: 'Synthetischer Farbstoff, der mit Hyperaktivität bei Kindern in Verbindung steht',
    zh: '合成色素，与敏感儿童的多动症倾向相关',
    ar: 'صبغة صناعية مرتبطة بفرط النشاط لدى الأطفال الحساسين',
    ja: '一部の敏感な小児において多動性との関連が指摘されている合成着色料',
    pt: 'Corante sintético associado à hiperatividade em crianças sensíveis',
    ru: 'Синтетический краситель, связанный с гиперактивностью у чувствительных детей',
    it: 'Colorante sintetico collegato all\'iperattività nei bambini sensibili',
    bn: 'সিন্থেটিক খাদ্য রং যা সংবেদনশীল শিশুদের মধ্যে অতিসক্রিয়তার (hyperactivity) কারণ হতে পারে'
  },

  // Citric Acid Reason
  'Naturally occurring acid, widely recognized as safe': {
    hi: 'प्राकृतिक रूप से पाया जाने वाला एसिड, पूर्णतः सुरक्षित माना गया है',
    es: 'Ácido de origen natural, ampliamente reconocido como seguro',
    fr: 'Acide d\'origine naturelle, largement reconnu comme sûr',
    de: 'Natürlich vorkommende Säure, allgemein als sicher eingestuft',
    zh: '天然存在的有机酸，被广泛公认为安全无害',
    ar: 'حمض طبيعي معترف به على نطاق واسع بأنه آمن',
    ja: '天然由来の有機酸で、安全性が広く認知されています',
    pt: 'Ácido natural amplamente reconhecido como seguro',
    ru: 'Натуральная кислота, признанная безопасной',
    it: 'Acido naturale ampiamente riconosciuto come sicuro',
    bn: 'প্রাকৃতিকভাবে প্রাপ্ত অ্যাসিড, খাদ্য হিসেবে সম্পূর্ণ নিরাপদ হিসেবে স্বীকৃত'
  },

  // Palm oil reason
  'High in saturated palmitic acid, associated with elevated LDL cholesterol.': {
    hi: 'संतृप्त पामिटिक एसिड में उच्च, खराब (LDL) कोलेस्ट्रॉल बढ़ाने से जुड़ा है।',
    es: 'Alto en ácido palmítico saturado, asociado con el aumento del colesterol LDL.',
    fr: 'Riche en acide palmitique saturé, associé à une augmentation du cholestérol LDL.',
    de: 'Reich an gesättigter Palmitinsäure, verbunden mit erhöhtem LDL-Cholesterin.',
    zh: '富含饱和棕榈酸，与坏胆固醇（LDL）升高相关。',
    ar: 'غني بحمض البالمتيك المشبع، المرتبط بارتفاع الكوليسترول الضار.',
    ja: '飽和脂肪酸（パルミチン酸）が多く、LDLコレステロール上昇に関与します。',
    pt: 'Rico em gorduras saturadas, associado ao aumento do colesterol LDL.',
    ru: 'Богато насыщенной пальмитиновой кислотой, повышает уровень плохого холестерина.',
    it: 'Ricco di acido palmitico saturo, associato all\'aumento del colesterolo LDL.',
    bn: 'স্যাচুরেটেড ফ্যাট সমৃদ্ধ, যা রক্তে ক্ষতিকর কোলেস্টেরল (LDL) বৃদ্ধি করে।'
  },

  // Safer Alternative Reasons
  'Natural zero-calorie sweetener that does not spike blood sugar levels.': {
    hi: 'प्राकृतिक शून्य-कैलोरी स्वीटनर जो रक्त शर्करा (ब्लड शुगर) को नहीं बढ़ाता।',
    es: 'Edulcorante natural de cero calorías que no eleva los niveles de azúcar en sangre.',
    fr: 'Édulcorant naturel sans calories qui n\'augmente pas la glycémie.',
    de: 'Natürlicher kalorienfreier Süßstoff, der den Blutzuckerspiegel nicht ansteigen lässt.',
    zh: '天然零卡路里甜味剂，不会引起血糖剧烈波动。',
    ar: 'محلي طبيعي خالي من السعرات الحرارية لا يرفع نسبة السكر في الدم.',
    ja: '血糖値を急上昇させない天然のゼロカロリー甘味料。',
    pt: 'Adoçante natural sem calorias que não altera a glicemia.',
    ru: 'Натуральный бескалорийный подсластитель, не повышающий уровень сахара.',
    it: 'Dolcificante naturale a zero calorie che non altera i livelli di glucosio.',
    bn: 'প্রাকৃতিক জিরো-ক্যালোরি মিষ্টি যা রক্তে শর্করার মাত্রা বাড়ায় না।'
  },

  'Derived from natural plant sources without chemical processing or harmful byproducts.': {
    hi: 'बिना किसी रासायनिक प्रसंस्करण या हानिकारक उप-उत्पादों के प्राकृतिक पौधों से प्राप्त।',
    es: 'Derivado de fuentes vegetales naturales sin procesamiento químico.',
    fr: 'Dérivé de sources végétales naturelles sans traitement chimique.',
    de: 'Aus natürlichen Pflanzenquellen ohne chemische Verarbeitung gewonnen.',
    zh: '提取自天然植物，无化学加工副产物。',
    ar: 'مشتق من مصادر نباتية طبيعية دون معالجة كيميائية.',
    ja: '化学処理を伴わず天然植物から抽出された安全な色素。',
    pt: 'Derivado de fontes vegetais naturais sem aditivos químicos.',
    ru: 'Получено из натуральных растительных компонентов без вредной химии.',
    it: 'Derivato da piante naturali senza trattamenti chimici nocivi.',
    bn: 'রাসায়নিক প্রক্রিয়া ছাড়াই প্রাকৃতিক উদ্ভিজ্জ উৎস থেকে তৈরি।'
  },

  'Uses naturally-occurring nitrates at lower concentration': {
    hi: 'कम सांद्रता में प्राकृतिक रूप से पाए जाने वाले नाइट्रेट का उपयोग करता है',
    es: 'Utiliza nitratos naturales en concentraciones más bajas',
    fr: 'Utilise des nitrates naturels à plus faible concentration',
    de: 'Verwendet natürlich vorkommende Nitrate in geringerer Konzentration',
    zh: '使用较低浓度的天然植物硝酸盐',
    ar: 'يستخدم النترات الطبيعية بتركيزات أقل',
    ja: '低濃度の天然硝酸塩を使用',
    pt: 'Utiliza nitratos naturais em menor concentração',
    ru: 'Использует натуральные нитраты в меньшей концентрации',
    it: 'Utilizza nitrati naturali a concentrazioni inferiori',
    bn: 'কম ঘনমাত্রায় প্রাকৃতিকভাবে প্রাপ্ত নাইট্রেট ব্যবহার করে'
  },

  'No added nitrites or nitrates': {
    hi: 'कोई अतिरिक्त नाइट्राइट या नाइट्रेट नहीं मिलाया गया',
    es: 'Sin nitritos ni nitratos añadidos',
    fr: 'Sans nitrites ni nitrates ajoutés',
    de: 'Ohne zugesetzte Nitrite oder Nitrate',
    zh: '不添加亚硝酸盐或硝酸盐',
    ar: 'خالٍ من النتريت أو النترات المضافة',
    ja: '亜硝酸塩・硝酸塩無添加',
    pt: 'Sem adição de nitritos ou nitratos',
    ru: 'Без добавления нитритов или нитратов',
    it: 'Senza nitriti o nitrati aggiunti',
    bn: 'কোনও অতিরিক্ত নাইট্রাইট বা নাইট্রেট যুক্ত করা হয়নি'
  },

  'Uses natural plant-based coloring': {
    hi: 'प्राकृतिक पौधे-आधारित रंग का उपयोग करता है',
    es: 'Utiliza colorantes naturales de origen vegetal',
    fr: 'Utilise un colorant végétal naturel',
    de: 'Verwendet natürliche pflanzliche Farbstoffe',
    zh: '采用天然植物提取色素',
    ar: 'يستخدم ألوانًا نباتية طبيعية',
    ja: '天然の植物由来着色料を使用',
    pt: 'Utiliza corantes naturais à base de plantas',
    ru: 'Использует натуральные растительные красители',
    it: 'Utilizza coloranti naturali a base vegetale',
    bn: 'প্রাকৃতিক উদ্ভিজ্জ খাদ্য রং ব্যবহার করে'
  }
}

// Translate dynamic ingredient names
const INGREDIENT_NAMES: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  'Carbonated Water': {
    hi: 'कार्बोनेटेड पानी (Carbonated Water)',
    es: 'Agua carbonatada',
    fr: 'Eau gazéifiée',
    de: 'Kohlensäurehaltiges Wasser',
    zh: '碳酸水',
    ar: 'ماء مكربن',
    ja: '炭酸水',
    pt: 'Água gaseificada',
    ru: 'Газированная вода',
    it: 'Acqua gassata',
    bn: 'কার্বনেটেড জল'
  },
  'Sugar (Sucrose or High-Fructose Corn Syrup)': {
    hi: 'चीनी (सुक्रोज या हाई-फ्रुक्टोज कॉर्न सिरप)',
    es: 'Azúcar (Sacarosa o Jarabe de maíz)',
    fr: 'Sucre (Saccharose ou Sirop de maïs)',
    de: 'Zucker (Saccharose oder Glukosesirup)',
    zh: '糖（蔗糖或高果糖玉米糖浆）',
    ar: 'سكر (سكروز أو شراب الذرة عالي الفركتوز)',
    ja: '砂糖（果糖ブドウ糖液糖）',
    pt: 'Açúcar (Sacarose ou Xarope de milho)',
    ru: 'Сахар (сахароза или кукурузный сироп)',
    it: 'Zucchero (Saccarosio o Sciroppo di mais)',
    bn: 'চিনি (সুক্রোজ বা হাই-ফ্রুক্টোজ কর্ন সিরাপ)'
  },
  'Caramel Color': {
    hi: 'कैरेमल रंग (Caramel Color)',
    es: 'Colorante caramelo',
    fr: 'Colorant caramel',
    de: 'Zuckerkulör',
    zh: '焦糖色素',
    ar: 'لون الكراميل',
    ja: 'カラメル色素',
    pt: 'Corante caramelo',
    ru: 'Карамельный краситель',
    it: 'Colorante caramello',
    bn: 'ক্যারামেল রং'
  },
  'Phosphoric Acid': {
    hi: 'फॉस्फोरिक एसिड (Phosphoric Acid)',
    es: 'Ácido fosfórico',
    fr: 'Acide phosphorique',
    de: 'Phosphorsäure',
    zh: '磷酸',
    ar: 'حمض الفوسفوريك',
    ja: 'リン酸',
    pt: 'Ácido fosfórico',
    ru: 'Фосфорная кислота',
    it: 'Acido fosforico',
    bn: 'ফসফরিক অ্যাসিড'
  },
  'Caffeine': {
    hi: 'कैफीन (Caffeine)',
    es: 'Cafeína',
    fr: 'Caféine',
    de: 'Koffein',
    zh: '咖啡因',
    ar: 'كافيين',
    ja: 'カフェイン',
    pt: 'Cafeína',
    ru: 'Кофеин',
    it: 'Caffeina',
    bn: 'ক্যাফেইন'
  },
  'Sodium Nitrite': {
    hi: 'सोडियम नाइट्राइट (Sodium Nitrite)',
    es: 'Nitrito de sodio',
    fr: 'Nitrite de sodium',
    de: 'Natriumnitrit',
    zh: '亚硝酸钠',
    ar: 'نتريت الصوديوم',
    ja: '亜硝酸ナトリウム',
    pt: 'Nitrito de sódio',
    ru: 'Нитрит натрия',
    it: 'Nitrito di sodio',
    bn: 'সোডিয়াম নাইট্রাইট'
  },
  'Citric Acid': {
    hi: 'साइट्रिक एसिड (Citric Acid)',
    es: 'Ácido cítrico',
    fr: 'Acide citrique',
    de: 'Zitronensäure',
    zh: '柠檬酸',
    ar: 'حمض الستريك',
    ja: 'クエン酸',
    pt: 'Ácido cítrico',
    ru: 'Лимонная кислота',
    it: 'Acido citrico',
    bn: 'সাইট্রিক অ্যাসিড'
  },
  'Tartrazine': {
    hi: 'टार्ट्राज़िन (Tartrazine E102)',
    es: 'Tartrazina (E102)',
    fr: 'Tartrazine (E102)',
    de: 'Tartrazin (E102)',
    zh: '柠檬黄 (Tartrazine)',
    ar: 'تارترازين (E102)',
    ja: 'タートラジン (黄4)',
    pt: 'Tartrazina (E102)',
    ru: 'Тартразин (E102)',
    it: 'Tartrazina (E102)',
    bn: 'টারট্রাজিন (E102)'
  },
  'Stevia Leaf Extract': {
    hi: 'स्टीविया पत्ती का अर्क (Stevia Extract)',
    es: 'Extracto de hoja de stevia',
    fr: 'Extrait de feuille de stévia',
    de: 'Steviablattextrakt',
    zh: '甜叶菊提取物 (Stevia)',
    ar: 'مستخلص أوراق الستيفيا',
    ja: 'ステビア抽出物',
    pt: 'Extrato de folhas de estévia',
    ru: 'Экстракт листьев стевии',
    it: 'Estratto di foglie di stevia',
    bn: 'স্টিভিয়া পাতার নির্যাস'
  },
  'Natural Fruit or Vegetable Juice Color': {
    hi: 'प्राकृतिक फल या सब्जी का रस रंग',
    es: 'Colorante natural de jugo de frutas/verduras',
    fr: 'Colorant naturel à base de jus de fruits/légumes',
    de: 'Natürlicher Frucht- oder Gemüsesaftfarbstoff',
    zh: '天然果蔬提取色素',
    ar: 'لون طبيعي من عصير الفواكه أو الخضار',
    ja: '天然果汁・野菜色素',
    pt: 'Corante natural de suco de frutas/vegetais',
    ru: 'Натуральный краситель из сока фруктов/овощей',
    it: 'Colorante naturale da succo di frutta/verdura',
    bn: 'প্রাকৃতিক ফল বা শাকসবজির রসের নির্যাস'
  },
  'Celery Powder Cured Bacon': {
    hi: 'अजवाइन पाउडर उपचारित बेकन',
    es: 'Tocino curado con polvo de apio',
    fr: 'Bacon traité à la poudre de céleri',
    de: 'Mit Selleriepulver gepökelter Speck',
    zh: '芹菜粉腌制培根',
    ar: 'لحم مقدد معالج بمسحوق الكرفس',
    ja: 'セロリパウダー使用のベーコン',
    pt: 'Bacon curado com pó de aipo',
    ru: 'Бекон с порошком сельдерея',
    it: 'Pancetta trattata con polvere di sedano',
    bn: 'সেলারির গুঁড়া দিয়ে প্রস্তুতকৃত বেকন'
  },
  'Nitrate-Free Deli Turkey': {
    hi: 'नाइट्रेट-मुक्त डेली टर्की',
    es: 'Pavo sin nitratos',
    fr: 'Dinde sans nitrates',
    de: 'Nitratfreier Putenschinken',
    zh: '无硝酸盐熟火鸡肉',
    ar: 'ديك رومي خالي من النترات',
    ja: '無塩せきターキー',
    pt: 'Peito de peru sem nitratos',
    ru: 'Индейка без нитратов',
    it: 'Tacchino senza nitrati',
    bn: 'নাইট্রেট-মুক্ত টার্কি'
  },
  'Turmeric & Beta-Carotene Colored Snack': {
    hi: 'हल्दी और बीटा-कैरोटीन प्राकृतिक रंगीन स्नैक',
    es: 'Snack coloreado con cúrcuma y betacaroteno',
    fr: 'Collation colorée au curcuma et bêta-carotène',
    de: 'Mit Kurkuma & Beta-Carotin gefärbter Snack',
    zh: '姜黄与β-胡萝卜素天然着色小吃',
    ar: 'وجبة خفيفة ملونة بالكركم وبيتا كاروتين',
    ja: 'ウコン＆βカロテン着色スナック',
    pt: 'Snack com cúrcuma e betacaroteno',
    ru: 'Снэк с куркумой и бета-каротином',
    it: 'Snack colorato con curcuma e beta-carotene',
    bn: 'হলুদ ও বিটা-ক্যারোটিন দ্বারা রঙিন নাস্তা'
  }
}

/**
 * Universal text translation function that looks up full phrases,
 * sentences, or keywords and provides localized text.
 */
export function translateContent(text: string | null | undefined, lang: SupportedLanguage): string {
  if (!text) return ''
  if (lang === 'en') return text

  const trimmed = text.trim()

  // 1. Direct dictionary match
  if (CONTENT_DICTIONARY[trimmed]?.[lang]) {
    return CONTENT_DICTIONARY[trimmed]![lang]!
  }

  // 2. Ingredient names direct match
  if (INGREDIENT_NAMES[trimmed]?.[lang]) {
    return INGREDIENT_NAMES[trimmed]![lang]!
  }

  // 3. Verdict match
  if (VERDICT_TRANSLATIONS[lang]?.[trimmed]) {
    return VERDICT_TRANSLATIONS[lang][trimmed]
  }

  // 4. Status match
  if (STATUS_TRANSLATIONS[lang]?.[trimmed]) {
    return STATUS_TRANSLATIONS[lang][trimmed]
  }

  // 5. Country match
  if (COUNTRY_TRANSLATIONS[lang]?.[trimmed]) {
    return COUNTRY_TRANSLATIONS[lang][trimmed]
  }

  // 6. Fuzzy / pattern-based dynamic translations for custom generated AI summaries
  // E.g. "[Product] contains X analyzed ingredients. Y ingredient(s) carry moderate nutritional considerations."
  const customAnalyzedMatch = trimmed.match(/^(.*?) contains (\d+) analyzed ingredients\.(.*)$/i)
  if (customAnalyzedMatch) {
    const prod = customAnalyzedMatch[1]
    const count = customAnalyzedMatch[2]
    const rest = customAnalyzedMatch[3]

    if (lang === 'hi') {
      return `${prod} में ${count} विश्लेषित सामग्री शामिल हैं।${
        rest.includes('moderate')
          ? ' कुछ सामग्री में मध्यम स्वास्थ्य संबंधी विचार हैं।'
          : ' कुल मिलाकर, सामग्री एक स्वस्थ पोषण प्रोफ़ाइल प्रदर्शित करती है।'
      }`
    }
    if (lang === 'es') {
      return `${prod} contiene ${count} ingredientes analizados.${
        rest.includes('moderate')
          ? ' Algunos ingredientes requieren consideraciones nutricionales.'
          : ' En general, los ingredientes demuestran un perfil nutricional saludable.'
      }`
    }
    if (lang === 'fr') {
      return `${prod} contient ${count} ingrédients analysés.${
        rest.includes('moderate')
          ? ' Certains ingrédients présentent des considérations nutritionnelles.'
          : ' Dans l\'ensemble, les ingrédients présentent un profil sain.'
      }`
    }
    if (lang === 'de') {
      return `${prod} enthält ${count} analysierte Zutaten.${
        rest.includes('moderate')
          ? ' Einige Zutaten erfordern ernährungsphysiologische Beachtung.'
          : ' Insgesamt weisen die Zutaten ein gesundes Nährwertprofil auf.'
      }`
    }
    if (lang === 'zh') {
      return `${prod} 包含 ${count} 种分析成分。${
        rest.includes('moderate')
          ? ' 部分成分存在营养考量或添加风险。'
          : ' 总体而言，配料表表现出健康纯净的营养构成。'
      }`
    }
    if (lang === 'ar') {
      return `${prod} يحتوي على ${count} من المكونات التي تم تحليلها.${
        rest.includes('moderate')
          ? ' بعض المكونات تتطلب اعتبارات غذائية خاصة.'
          : ' بشكل عام، تظهر المكونات قيمة غذائية جيدة.'
      }`
    }
    if (lang === 'ja') {
      return `${prod}には${count}種類の分析成分が含まれています。${
        rest.includes('moderate')
          ? ' 一部の成分には栄養上の注意が必要です。'
          : ' 全体として、健康的で安全な原材料構成となっています。'
      }`
    }
    if (lang === 'pt') {
      return `${prod} contém ${count} ingredientes analisados.${
        rest.includes('moderate')
          ? ' Alguns ingredientes requerem atenção nutricional.'
          : ' No geral, os ingredientes demonstram um perfil saudável.'
      }`
    }
    if (lang === 'ru') {
      return `${prod} содержит ${count} проанализированных ингредиентов.${
        rest.includes('moderate')
          ? ' Некоторые ингредиенты требуют внимания к питательной ценности.'
          : ' В целом состав демонстрирует здоровый питательный профиль.'
      }`
    }
    if (lang === 'it') {
      return `${prod} contiene ${count} ingredienti analizzati.${
        rest.includes('moderate')
          ? ' Alcuni ingredienti richiedono moderazione.'
          : ' Nel complesso, gli ingredienti mostrano un profilo sano.'
      }`
    }
    if (lang === 'bn') {
      return `${prod}-এ ${count}টি বিশ্লেষিত উপাদান রয়েছে।${
        rest.includes('moderate')
          ? ' কিছু উপাদানে মাঝারি পুষ্টি বিবেচনা রয়েছে।'
          : ' সামগ্রিকভাবে উপাদানগুলো স্বাস্থ্যকর পুষ্টিমান প্রদর্শন করে।'
      }`
    }
  }

  // Allergy pattern: "Contains soy and may contain traces of tree nuts."
  if (/^Contains /i.test(trimmed)) {
    if (lang === 'hi') return trimmed.replace(/^Contains /i, 'इसमें शामिल है: ').replace(/and may contain traces of/i, 'तथा इसके अंश हो सकते हैं:')
    if (lang === 'es') return trimmed.replace(/^Contains /i, 'Contiene ').replace(/and may contain traces of/i, 'y puede contener trazas de')
    if (lang === 'fr') return trimmed.replace(/^Contains /i, 'Contient ').replace(/and may contain traces of/i, 'et peut contenir des traces de')
    if (lang === 'de') return trimmed.replace(/^Contains /i, 'Enthält ').replace(/and may contain traces of/i, 'und kann Spuren enthalten von')
    if (lang === 'zh') return trimmed.replace(/^Contains /i, '含有：').replace(/and may contain traces of/i, '并可能含有微量：')
    if (lang === 'ar') return trimmed.replace(/^Contains /i, 'يحتوي على: ').replace(/and may contain traces of/i, 'وقد يحتوي على آثار من:')
    if (lang === 'ja') return trimmed.replace(/^Contains /i, '含有アレルゲン：').replace(/and may contain traces of/i, 'また以下の微量混入の可能性あり：')
    if (lang === 'pt') return trimmed.replace(/^Contains /i, 'Contém ').replace(/and may contain traces of/i, 'e pode conter vestígios de')
    if (lang === 'ru') return trimmed.replace(/^Contains /i, 'Содержит ').replace(/and may contain traces of/i, 'и может содержать следы')
    if (lang === 'it') return trimmed.replace(/^Contains /i, 'Contiene ').replace(/and may contain traces of/i, 'e può contenere tracce di')
    if (lang === 'bn') return trimmed.replace(/^Contains /i, 'এতে রয়েছে: ').replace(/and may contain traces of/i, 'এবং অবশিষ্টাংশ থাকতে পারে:')
  }

  return text
}
