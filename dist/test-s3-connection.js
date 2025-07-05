"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var client_s3_1 = require("@aws-sdk/client-s3");
var dotenv = __importStar(require("dotenv"));
// 環境変数をロード
dotenv.config({ path: ".env.local" });
var s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
var BUCKET_NAME = process.env.S3_BUCKET_NAME;
function testS3Connection() {
    return __awaiter(this, void 0, void 0, function () {
        var listCommand, listResponse, testContent, uploadCommand, baseUrl, testUrl, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log("🔍 S3接続テストを開始します...");
                    console.log("\u30D0\u30B1\u30C3\u30C8\u540D: ".concat(BUCKET_NAME));
                    console.log("\u30EA\u30FC\u30B8\u30E7\u30F3: ".concat(process.env.AWS_REGION));
                    // 1. バケットの存在確認
                    console.log("\n1. バケットの存在確認...");
                    listCommand = new client_s3_1.ListObjectsV2Command({
                        Bucket: BUCKET_NAME,
                        MaxKeys: 1,
                    });
                    return [4 /*yield*/, s3Client.send(listCommand)];
                case 1:
                    listResponse = _a.sent();
                    console.log("✅ バケットへのアクセス成功");
                    // 2. テストファイルのアップロード
                    console.log("\n2. テストファイルのアップロード...");
                    testContent = "\u30C6\u30B9\u30C8\u5B9F\u884C\u65E5\u6642: ".concat(new Date().toISOString());
                    uploadCommand = new client_s3_1.PutObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: "test/connection-test.txt",
                        Body: testContent,
                        ContentType: "text/plain",
                    });
                    return [4 /*yield*/, s3Client.send(uploadCommand)];
                case 2:
                    _a.sent();
                    console.log("✅ ファイルのアップロード成功");
                    baseUrl = process.env.CLOUDFRONT_DOMAIN ||
                        "https://".concat(BUCKET_NAME, ".s3.").concat(process.env.AWS_REGION, ".amazonaws.com");
                    testUrl = "".concat(baseUrl, "/test/connection-test.txt");
                    console.log("\n📋 テスト結果:");
                    console.log("\u2705 S3\u63A5\u7D9A: \u6B63\u5E38");
                    console.log("\u2705 \u30A2\u30C3\u30D7\u30ED\u30FC\u30C9: \u6B63\u5E38");
                    console.log("\uD83D\uDCC4 \u30C6\u30B9\u30C8\u30D5\u30A1\u30A4\u30EBURL: ".concat(testUrl));
                    console.log("\n🎉 すべてのテストが成功しました！");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("\n❌ S3接続テストに失敗しました:");
                    console.error(error_1);
                    console.log("\n🔧 確認項目:");
                    console.log("- AWS_ACCESS_KEY_ID が正しく設定されているか");
                    console.log("- AWS_SECRET_ACCESS_KEY が正しく設定されているか");
                    console.log("- S3_BUCKET_NAME が正しく設定されているか");
                    console.log("- IAMユーザーに適切な権限が付与されているか");
                    console.log("- バケットポリシーが正しく設定されているか");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// 実行
testS3Connection();
