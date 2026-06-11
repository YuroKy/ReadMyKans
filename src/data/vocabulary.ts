export interface VocabularyEntry {
  kana: string
  translation: string
}

// Базовий словник N5: слова чистою каною (без кандзі — щоб не залежати від
// kuromoji) з українським перекладом. Ключ — кана слова, тому всі `kana`
// мають бути унікальними.
export const VOCABULARY: VocabularyEntry[] = [
  // Тварини
  { kana: 'ねこ', translation: 'кіт' },
  { kana: 'いぬ', translation: 'собака' },
  { kana: 'とり', translation: 'птах' },
  { kana: 'さかな', translation: 'риба' },
  { kana: 'うし', translation: 'корова' },
  { kana: 'うま', translation: 'кінь' },

  // Їжа і напої
  { kana: 'みず', translation: 'вода' },
  { kana: 'おちゃ', translation: 'чай' },
  { kana: 'ごはん', translation: 'рис; їжа' },
  { kana: 'たまご', translation: 'яйце' },
  { kana: 'にく', translation: 'мʼясо' },
  { kana: 'やさい', translation: 'овочі' },
  { kana: 'くだもの', translation: 'фрукти' },
  { kana: 'さとう', translation: 'цукор' },
  { kana: 'しお', translation: 'сіль' },
  { kana: 'パン', translation: 'хліб' },
  { kana: 'ぎゅうにゅう', translation: 'молоко' },
  { kana: 'コーヒー', translation: 'кава' },
  { kana: 'ジュース', translation: 'сік' },

  // Дім і речі
  { kana: 'いえ', translation: 'дім' },
  { kana: 'へや', translation: 'кімната' },
  { kana: 'まど', translation: 'вікно' },
  { kana: 'ドア', translation: 'двері' },
  { kana: 'つくえ', translation: 'стіл' },
  { kana: 'いす', translation: 'стілець' },
  { kana: 'ほん', translation: 'книжка' },
  { kana: 'かばん', translation: 'сумка' },
  { kana: 'とけい', translation: 'годинник' },
  { kana: 'でんわ', translation: 'телефон' },
  { kana: 'テレビ', translation: 'телевізор' },
  { kana: 'かさ', translation: 'парасолька' },
  { kana: 'かぎ', translation: 'ключ' },
  { kana: 'しゃしん', translation: 'фотографія' },
  { kana: 'てがみ', translation: 'лист' },
  { kana: 'おかね', translation: 'гроші' },

  // Транспорт і місто
  { kana: 'くるま', translation: 'автомобіль' },
  { kana: 'じてんしゃ', translation: 'велосипед' },
  { kana: 'でんしゃ', translation: 'потяг' },
  { kana: 'ひこうき', translation: 'літак' },
  { kana: 'えき', translation: 'станція' },
  { kana: 'みち', translation: 'дорога' },
  { kana: 'みせ', translation: 'крамниця' },
  { kana: 'びょういん', translation: 'лікарня' },
  { kana: 'ぎんこう', translation: 'банк' },

  // Люди
  { kana: 'ひと', translation: 'людина' },
  { kana: 'おとこ', translation: 'чоловік' },
  { kana: 'おんな', translation: 'жінка' },
  { kana: 'こども', translation: 'дитина' },
  { kana: 'ともだち', translation: 'друг' },
  { kana: 'かぞく', translation: 'сімʼя' },
  { kana: 'おかあさん', translation: 'мама' },
  { kana: 'おとうさん', translation: 'тато' },
  { kana: 'せんせい', translation: 'учитель' },
  { kana: 'がくせい', translation: 'студент' },
  { kana: 'いしゃ', translation: 'лікар' },
  { kana: 'なまえ', translation: 'імʼя' },

  // Тіло
  { kana: 'あたま', translation: 'голова' },
  { kana: 'かお', translation: 'обличчя' },
  { kana: 'め', translation: 'око' },
  { kana: 'みみ', translation: 'вухо' },
  { kana: 'はな', translation: 'ніс; квітка' },
  { kana: 'くち', translation: 'рот' },
  { kana: 'て', translation: 'рука' },
  { kana: 'あし', translation: 'нога' },

  // Природа
  { kana: 'やま', translation: 'гора' },
  { kana: 'かわ', translation: 'річка' },
  { kana: 'うみ', translation: 'море' },
  { kana: 'そら', translation: 'небо' },
  { kana: 'あめ', translation: 'дощ' },
  { kana: 'ゆき', translation: 'сніг' },
  { kana: 'かぜ', translation: 'вітер; застуда' },
  { kana: 'くも', translation: 'хмара' },
  { kana: 'つき', translation: 'місяць' },
  { kana: 'ほし', translation: 'зірка' },
  { kana: 'き', translation: 'дерево' },
  { kana: 'いし', translation: 'камінь' },

  // Час
  { kana: 'きょう', translation: 'сьогодні' },
  { kana: 'あした', translation: 'завтра' },
  { kana: 'きのう', translation: 'вчора' },
  { kana: 'いま', translation: 'зараз' },
  { kana: 'あさ', translation: 'ранок' },
  { kana: 'ひる', translation: 'полудень; день' },
  { kana: 'ばん', translation: 'вечір' },
  { kana: 'よる', translation: 'ніч' },
  { kana: 'ことし', translation: 'цей рік' },
  { kana: 'まいにち', translation: 'щодня' },

  // Школа
  { kana: 'がっこう', translation: 'школа' },
  { kana: 'きょうしつ', translation: 'клас (кімната)' },
  { kana: 'えんぴつ', translation: 'олівець' },
  { kana: 'かみ', translation: 'папір; волосся' },
  { kana: 'じしょ', translation: 'словник' },
  { kana: 'しゅくだい', translation: 'домашнє завдання' },

  // Прикметники
  { kana: 'おおきい', translation: 'великий' },
  { kana: 'ちいさい', translation: 'маленький' },
  { kana: 'あたらしい', translation: 'новий' },
  { kana: 'ふるい', translation: 'старий (про речі)' },
  { kana: 'たかい', translation: 'високий; дорогий' },
  { kana: 'やすい', translation: 'дешевий' },
  { kana: 'さむい', translation: 'холодний (погода)' },
  { kana: 'あつい', translation: 'гарячий; спекотний' },
  { kana: 'おいしい', translation: 'смачний' },
  { kana: 'たのしい', translation: 'веселий; приємний' },
]

// Лукап перекладів переїхав у ./wordSources (спільний для всіх словесних
// джерел: словник, числа, власні слова, кандзі).
