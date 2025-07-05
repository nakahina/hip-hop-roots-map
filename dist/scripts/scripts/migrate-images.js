"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var postgres_js_1 = require("drizzle-orm/postgres-js");
var postgres_1 = __importDefault(require("postgres"));
var schema_1 = require("../db/schema");
var s3_upload_1 = require("../utils/s3-upload");
var drizzle_orm_1 = require("drizzle-orm");
// データベース接続
var connectionString = process.env.DATABASE_URL;
var client = (0, postgres_1.default)(connectionString);
var db = (0, postgres_js_1.drizzle)(client);
/**
 * 単一のアーティストの画像を移行
 */
function migrateArtistImages(artist) {
    return __awaiter(this, void 0, void 0, function () {
        var fileName, uploadResult, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log("\u753B\u50CF\u79FB\u884C\u958B\u59CB: ".concat(artist.name));
                    // 既にS3のURLの場合はスキップ
                    if (artist.originalImage && !artist.originalImage.includes("i.scdn.co")) {
                        console.log("\u30B9\u30AD\u30C3\u30D7: ".concat(artist.name, " - \u65E2\u306B\u79FB\u884C\u6E08\u307F"));
                        return [2 /*return*/, {
                                artistId: artist.id,
                                artistName: artist.name,
                                success: true,
                            }];
                    }
                    // 画像URLがない場合はスキップ
                    if (!artist.originalImage) {
                        console.log("\u30B9\u30AD\u30C3\u30D7: ".concat(artist.name, " - \u753B\u50CFURL\u304C\u3042\u308A\u307E\u305B\u3093"));
                        return [2 /*return*/, {
                                artistId: artist.id,
                                artistName: artist.name,
                                success: true,
                            }];
                    }
                    fileName = (0, s3_upload_1.generateFileNameFromUrl)(artist.originalImage);
                    return [4 /*yield*/, (0, s3_upload_1.uploadImageToS3)(artist.originalImage, fileName, artist.name)];
                case 1:
                    uploadResult = _a.sent();
                    if (!uploadResult.success) {
                        throw new Error(uploadResult.error || "不明なエラー");
                    }
                    // データベースを更新
                    return [4 /*yield*/, db
                            .update(schema_1.artists)
                            .set({
                            originalImage: uploadResult.originalUrl,
                            smallImage: uploadResult.smallUrl,
                            updatedAt: new Date(),
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.artists.id, artist.id))];
                case 2:
                    // データベースを更新
                    _a.sent();
                    console.log("\u79FB\u884C\u5B8C\u4E86: ".concat(artist.name));
                    return [2 /*return*/, {
                            artistId: artist.id,
                            artistName: artist.name,
                            success: true,
                            originalUrl: uploadResult.originalUrl,
                            smallUrl: uploadResult.smallUrl,
                        }];
                case 3:
                    error_1 = _a.sent();
                    console.error("\u79FB\u884C\u30A8\u30E9\u30FC: ".concat(artist.name), error_1);
                    return [2 /*return*/, {
                            artistId: artist.id,
                            artistName: artist.name,
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : "不明なエラー",
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 全アーティストの画像を移行
 */
function migrateAllImages() {
    return __awaiter(this, void 0, void 0, function () {
        var allArtists, artistsToMigrate, batchSize, results, i, batch, batchResults, successCount, failureCount, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, 8, 10]);
                    console.log("画像移行を開始します...");
                    return [4 /*yield*/, db.select().from(schema_1.artists)];
                case 1:
                    allArtists = _a.sent();
                    console.log("".concat(allArtists.length, "\u4EBA\u306E\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u3057\u305F"));
                    artistsToMigrate = allArtists.filter(function (artist) {
                        return artist.originalImage && artist.originalImage.includes("i.scdn.co");
                    });
                    console.log("".concat(artistsToMigrate.length, "\u4EBA\u306E\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u306E\u753B\u50CF\u3092\u79FB\u884C\u3057\u307E\u3059"));
                    if (artistsToMigrate.length === 0) {
                        console.log("移行が必要な画像はありません");
                        return [2 /*return*/];
                    }
                    batchSize = 5;
                    results = [];
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < artistsToMigrate.length)) return [3 /*break*/, 6];
                    batch = artistsToMigrate.slice(i, i + batchSize);
                    console.log("\u30D0\u30C3\u30C1 ".concat(Math.floor(i / batchSize) + 1, "/").concat(Math.ceil(artistsToMigrate.length / batchSize), " \u3092\u51E6\u7406\u4E2D..."));
                    return [4 /*yield*/, Promise.all(batch.map(migrateArtistImages))];
                case 3:
                    batchResults = _a.sent();
                    results.push.apply(results, batchResults);
                    if (!(i + batchSize < artistsToMigrate.length)) return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    i += batchSize;
                    return [3 /*break*/, 2];
                case 6:
                    successCount = results.filter(function (r) { return r.success; }).length;
                    failureCount = results.filter(function (r) { return !r.success; }).length;
                    console.log("\n=== 移行結果 ===");
                    console.log("\u6210\u529F: ".concat(successCount, "\u4EF6"));
                    console.log("\u5931\u6557: ".concat(failureCount, "\u4EF6"));
                    if (failureCount > 0) {
                        console.log("\n=== 失敗した移行 ===");
                        results
                            .filter(function (r) { return !r.success; })
                            .forEach(function (r) {
                            console.log("- ".concat(r.artistName, " (ID: ").concat(r.artistId, "): ").concat(r.error));
                        });
                    }
                    console.log("\n画像移行が完了しました！");
                    return [3 /*break*/, 10];
                case 7:
                    error_2 = _a.sent();
                    console.error("移行処理中にエラーが発生しました:", error_2);
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, client.end()];
                case 9:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
/**
 * 特定のアーティストの画像を移行
 */
function migrateSingleArtist(artistId) {
    return __awaiter(this, void 0, void 0, function () {
        var artist, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 6]);
                    console.log("\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8 ID ".concat(artistId, " \u306E\u753B\u50CF\u79FB\u884C\u3092\u958B\u59CB\u3057\u307E\u3059..."));
                    return [4 /*yield*/, db
                            .select()
                            .from(schema_1.artists)
                            .where((0, drizzle_orm_1.eq)(schema_1.artists.id, artistId))
                            .limit(1)];
                case 1:
                    artist = _a.sent();
                    if (artist.length === 0) {
                        console.log("\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8 ID ".concat(artistId, " \u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F"));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, migrateArtistImages(artist[0])];
                case 2:
                    result = _a.sent();
                    if (result.success) {
                        console.log("\u79FB\u884C\u6210\u529F: ".concat(result.artistName));
                        if (result.originalUrl) {
                            console.log("\u30AA\u30EA\u30B8\u30CA\u30EB\u753B\u50CF: ".concat(result.originalUrl));
                            console.log("\u5C0F\u3055\u306A\u753B\u50CF: ".concat(result.smallUrl));
                        }
                    }
                    else {
                        console.log("\u79FB\u884C\u5931\u6557: ".concat(result.artistName, " - ").concat(result.error));
                    }
                    return [3 /*break*/, 6];
                case 3:
                    error_3 = _a.sent();
                    console.error("移行処理中にエラーが発生しました:", error_3);
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, client.end()];
                case 5:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// コマンドライン実行
if (require.main === module) {
    var args = process.argv.slice(2);
    if (args.length === 0) {
        // 全アーティスト移行
        migrateAllImages();
    }
    else if (args[0] === "--artist-id" && args[1]) {
        // 特定のアーティスト移行
        var artistId = parseInt(args[1]);
        if (isNaN(artistId)) {
            console.error("無効なアーティストIDです");
            process.exit(1);
        }
        migrateSingleArtist(artistId);
    }
    else {
        console.log("使用方法:");
        console.log("  全アーティスト移行: npm run migrate-images");
        console.log("  特定のアーティスト: npm run migrate-images --artist-id 123");
    }
}
