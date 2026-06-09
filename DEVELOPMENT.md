# Inverse Hunter - Development Guide

## 開発環境セットアップ

### 必要なツール

- Node.js 14.0以上
- npm または yarn
- Git

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/guttyanneruuuuuu/gjm.git
cd gjm

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# ビルド
npm run build
```

## プロジェクト構造

```
gjm/
├── src/
│   ├── core/                # ゲームエンジン
│   │   ├── GameEngineV2.js
│   │   ├── AdvancedPhysicsSystem.js
│   │   ├── AdvancedCameraSystem.js
│   │   ├── ParticleSystem.js
│   │   ├── ShaderSystem.js
│   │   ├── GameStateManager.js
│   │   └── utils.js
│   ├── game/                # ゲームロジック
│   │   ├── PlayerV2.js
│   │   ├── EnemyV2.js
│   │   ├── EnemySpawnerV2.js
│   │   ├── CombatSystemV2.js
│   │   ├── TransformationSystemV2.js
│   │   └── InstinctGauge.js
│   ├── world/               # ワールド
│   │   └── WorldBuilderV2.js
│   ├── input/               # 入力
│   │   ├── InputManager.js
│   │   └── MobileControls.js
│   ├── ui/                  # UI
│   │   └── HUDSystem.js
│   ├── config/              # 設定
│   │   └── GameBalance.js
│   ├── mainV2.js           # メインエントリー
│   └── styles.css          # スタイル
├── index_final.html        # 最終HTMLファイル
├── package.json
└── webpack.config.js
```

## 主要なシステム

### 1. ゲームエンジン（GameEngineV2）

コアエンジンで以下を管理：
- Three.jsシーン・レンダラー
- 入力システム
- 物理システム
- カメラシステム
- パーティクルシステム
- シェーダーシステム

```javascript
const engine = new GameEngineV2(containerElement);
engine.start();
```

### 2. プレイヤーシステム（PlayerV2）

プレイヤーキャラクターの管理：
- 移動・ジャンプ・ダッシュ
- 変身システム
- 戦闘システム
- 本能ゲージ

```javascript
const player = new PlayerV2(engine, { x: 0, y: 5, z: 0 });
```

### 3. 戦闘システム（CombatSystemV2）

戦闘メカニクス：
- ターゲティング
- ロック・オン
- コンボ
- ダメージ計算

```javascript
player.getCombatSystem().attack('normal');
```

### 4. 敵システム（EnemyV2 + EnemySpawnerV2）

敵AI：
- 状態機械ベースのAI
- 複数の敵タイプ
- ウェーブシステム

```javascript
const spawner = new EnemySpawnerV2(scene, player, combatSystem);
spawner.startWave(0);
```

### 5. ワールドシステム（WorldBuilderV2）

ワールド生成：
- 手続き型地形生成
- プロップ配置
- ライティング

```javascript
const worldBuilder = new WorldBuilderV2(engine);
worldBuilder.buildStage(0);
```

## ゲームバランス調整

`src/config/GameBalance.js`で全てのバランス値を管理：

```javascript
// 例：プレイヤーHP変更
GameBalance.player.maxHp = 200;

// 例：敵ダメージ変更
GameBalance.enemies.basic.baseDamage = 10;

// 例：難易度設定
applyDifficultyMultipliers('hard');
```

## 拡張ガイド

### 新しい敵タイプの追加

1. `GameBalance.js`に敵タイプを追加：

```javascript
enemies: {
  boss: {
    baseHp: 200,
    baseDamage: 20,
    baseSpeed: 8,
    attackRange: 4,
    detectionRange: 50,
    attackCooldown: 2.5,
  }
}
```

2. `EnemyV2.js`の`getStats()`メソッドを更新

3. `EnemySpawnerV2.js`のウェーブ設定に追加

### 新しい形態の追加

1. `PlayerV2.js`の`forms`オブジェクトに追加：

```javascript
forms: {
  dragon: {
    id: 'dragon',
    name: 'ドラゴン',
    emoji: '🐉',
    speed: 15,
    jump: 20,
    canFly: true,
    dashSpeed: 35,
    attackRange: 6,
    attackDamage: 20,
  }
}
```

2. `TransformationSystemV2.js`に色を追加：

```javascript
formColors: {
  dragon: 0xff6b00,
}
```

### カスタムシェーダーの追加

1. `ShaderSystem.js`の`initializeShaders()`に追加：

```javascript
this.shaders.custom = {
  vertex: `...`,
  fragment: `...`
};
```

2. 使用：

```javascript
const material = shaderSystem.createShaderMaterial('custom', uniforms);
```

## パフォーマンス最適化

### メモリ管理

- パーティクルプーリング：`ParticleSystem.js`
- メッシュ再利用
- テクスチャアトラス

### レンダリング最適化

- シャドウマップ解像度調整
- LOD（Level of Detail）
- フラスタムカリング

### 推奨設定

```javascript
// 低スペック環境
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.setPixelRatio(1);

// 高スペック環境
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

## デバッグ

### デバッグモード

ゲーム実行中に`D`キーを押すとデバッグ情報が表示：

```
FPS: 60
Uptime: 123.4s
Memory: 45.2MB
```

### コンソールログ

```javascript
console.log('Player position:', player.getPosition());
console.log('Combat stats:', player.getCombatSystem().getCombatStats());
console.log('Wave status:', spawner.getWaveStatus());
```

### テスト用キーボードショートカット

| キー | 機能 |
|------|------|
| U | 全フォーム解放 |
| D | デバッグ情報表示 |
| R | ゲームリスタート |

## ビルドとデプロイ

### 開発ビルド

```bash
npm run dev
```

### 本番ビルド

```bash
npm run build
```

### デプロイ

```bash
# GitHubにプッシュ
git add .
git commit -m "Update: description"
git push origin genspark_ai_developer
```

## トラブルシューティング

### ゲームが起動しない

1. ブラウザコンソールでエラーを確認
2. `index_final.html`が正しく読み込まれているか確認
3. Three.jsが正しくインストールされているか確認

### パフォーマンスが低い

1. FPS表示（D キー）で確認
2. シャドウマップ解像度を下げる
3. パーティクル数を減らす

### 敵が出現しない

1. `EnemySpawnerV2.startWave()`が呼ばれているか確認
2. ウェーブ設定が正しいか確認
3. 敵スポーン位置がプレイヤーから見える位置か確認

## パフォーマンスベンチマーク

目標値：

- **FPS**: 60 (PC), 30+ (Mobile)
- **メモリ**: < 100MB
- **ロード時間**: < 3秒

## 今後の改善予定

- [ ] サウンドシステム
- [ ] 音声エフェクト
- [ ] ボスエンカウンター
- [ ] ストーリーシーケンス
- [ ] マルチプレイヤー対応
- [ ] リーダーボード
- [ ] アチーブメント

## 参考資料

- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Specifications](https://www.khronos.org/webgl/)
- [Game Design Patterns](https://gameprogrammingpatterns.com/)

## 支援

問題が発生した場合は、GitHubのIssueを作成してください。

---

**最終更新**: 2026年6月9日
**バージョン**: 2.0.0
