const fs = require('fs');
const path = require('path');

// index.html から applyRegulations 関数を抽出して実行可能にする
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// function applyRegulations(text) { ... } の部分を正規表現で抽出
const match = htmlContent.match(/function applyRegulations\(text\) \{[\s\S]*?\n    \}/);

if (!match) {
  console.error("applyRegulations 関数が見つかりませんでした。");
  process.exit(1);
}

// 抽出した関数を評価して利用可能にする
const applyRegulationsStr = match[0];
const applyRegulations = new Function(`
  return ${applyRegulationsStr};
`)();

// テストケース定義
const testCases = [
  // 1. しめじ
  { input: "しめじを使います。", expected: "しめじを使います。" },
  { input: "鍋のしめにうどんを入れる。", expected: "鍋のしめにうどんを入れる。" }, // しめ → 締め のルールは削除したため変換されない
  // 2. 彩り
  { input: "彩りよく盛り付ける。", expected: "彩りよく盛り付ける。" },
  { input: "いろどりを添える。", expected: "彩りを添える。" },
  // 3. チンジャオロース
  { input: "チンジャオロースーを作る。", expected: "チンジャオロースーを作る。" },
  { input: "チンジャオロースを作る。", expected: "チンジャオロースーを作る。" },
  // 4. えび・エビチリ
  { input: "えびちりとエビチリ", expected: "エビチリとエビチリ" },
  { input: "エビチリを作る", expected: "エビチリを作る" },
  { input: "エビフライを作る", expected: "えびフライを作る" },
  // 5. センチ・ミリ
  { input: "3センチ幅に切ります。", expected: "3cm幅に切ります。" },
  { input: "5ミリ厚さに切る。", expected: "5mm厚さに切る。" },
  // 6. 度・℃
  { input: "170度のオーブンで", expected: "170℃のオーブンで" },
  { input: "90度回転させる。", expected: "90度回転させる。" },
  { input: "10度に分けて加える。", expected: "10度に分けて加える。" },
  { input: "2回に分けて加える。", expected: "2回に分けて加える。" },
  { input: "3度目の正直", expected: "3度目の正直" },
  // 7. 余る
  { input: "野菜があまる場合は...", expected: "野菜が余る場合は…" },
  { input: "あまったご飯で", expected: "余ったごはんで" }, // ご飯 → ごはん のルールも適用される
  
  // 追加1: Aの後のスペースは材料名の中だけで必要（ここでは単純置換のテストなので、applyRegulations 単体の挙動を確認）
  // 実際には A 砂糖 等は extractSections 内で処理されるが、
  // applyRegulations自体は "合わせたA をかけ" などを変換しない（何もしない）ことを確認する
  { input: "合わせたA をかけ", expected: "合わせたA をかけ" }, // 既にスペースがあればそのまま（変更しない）
  { input: "合わせたAをかけ", expected: "合わせたAをかけ" }, // 勝手にスペースを入れない
  
  // 追加2: 絡まる系の変換
  { input: "タレを絡まって食べる。", expected: "たれをからまって食べる。" },
  { input: "ソースがからまる", expected: "ソースがからまる" }, // 既にひらがな
  { input: "全体に絡める。", expected: "全体にからめる。" },
  
  // 追加3: 乗せ系の変換
  { input: "お皿に乗せた。", expected: "お皿にのせた。" },
  { input: "野菜を乗せます。", expected: "野菜をのせます。" },
  { input: "上に載せる", expected: "上にのせる" }
];

console.log("=== Notation Rules Test ===");
let passed = 0;
let failed = 0;

testCases.forEach((tc, index) => {
  const result = applyRegulations(tc.input);
  if (result === tc.expected) {
    console.log(`[PASS] Case ${index + 1}`);
    passed++;
  } else {
    console.log(`[FAIL] Case ${index + 1}`);
    console.log(`  Input   : ${tc.input}`);
    console.log(`  Expected: ${tc.expected}`);
    console.log(`  Actual  : ${result}`);
    failed++;
  }
});

console.log("===========================");
console.log(`Total: ${testCases.length}, Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
