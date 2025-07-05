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
exports.generateFileNameFromUrl = exports.uploadMultipleImages = exports.uploadImageToS3 = void 0;
var client_s3_1 = require("@aws-sdk/client-s3");
var lib_storage_1 = require("@aws-sdk/lib-storage");
var sharp_1 = __importDefault(require("sharp"));
var axios_1 = __importDefault(require("axios"));
// S3クライアントの設定
var s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
var BUCKET_NAME = process.env.S3_BUCKET_NAME;
var CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
/**
 * 画像URLから画像をダウンロードしてS3にアップロード
 */
function uploadImageToS3(imageUrl, fileName, artistName) {
    return __awaiter(this, void 0, void 0, function () {
        var response, imageBuffer, contentType, sanitizedArtistName, originalKey, originalUpload, smallImageBuffer, smallKey, smallUpload, baseUrl, originalUrl, smallUrl, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, axios_1.default.get(imageUrl, {
                            responseType: "arraybuffer",
                            timeout: 30000,
                        })];
                case 1:
                    response = _a.sent();
                    imageBuffer = Buffer.from(response.data);
                    contentType = response.headers["content-type"] || "image/jpeg";
                    sanitizedArtistName = artistName
                        .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "_")
                        .replace(/_{2,}/g, "_")
                        .replace(/^_|_$/g, "");
                    originalKey = "artists/".concat(sanitizedArtistName, "/original_").concat(fileName);
                    originalUpload = new lib_storage_1.Upload({
                        client: s3Client,
                        params: {
                            Bucket: BUCKET_NAME,
                            Key: originalKey,
                            Body: imageBuffer,
                            ContentType: contentType,
                            CacheControl: "max-age=31536000", // 1年
                        },
                    });
                    return [4 /*yield*/, originalUpload.done()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, sharp_1.default)(imageBuffer)
                            .resize(300, 300, {
                            fit: "cover",
                            position: "center",
                        })
                            .jpeg({ quality: 85 })
                            .toBuffer()];
                case 3:
                    smallImageBuffer = _a.sent();
                    smallKey = "artists/".concat(sanitizedArtistName, "/small_").concat(fileName);
                    smallUpload = new lib_storage_1.Upload({
                        client: s3Client,
                        params: {
                            Bucket: BUCKET_NAME,
                            Key: smallKey,
                            Body: smallImageBuffer,
                            ContentType: "image/jpeg",
                            CacheControl: "max-age=31536000", // 1年
                        },
                    });
                    return [4 /*yield*/, smallUpload.done()];
                case 4:
                    _a.sent();
                    baseUrl = CLOUDFRONT_DOMAIN ||
                        "https://".concat(BUCKET_NAME, ".s3.").concat(process.env.AWS_REGION || "ap-northeast-1", ".amazonaws.com");
                    originalUrl = "".concat(baseUrl, "/").concat(originalKey);
                    smallUrl = "".concat(baseUrl, "/").concat(smallKey);
                    return [2 /*return*/, {
                            originalUrl: originalUrl,
                            smallUrl: smallUrl,
                            success: true,
                        }];
                case 5:
                    error_1 = _a.sent();
                    console.error("S3アップロードエラー:", error_1);
                    return [2 /*return*/, {
                            originalUrl: "",
                            smallUrl: "",
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : "不明なエラー",
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.uploadImageToS3 = uploadImageToS3;
/**
 * 複数の画像を並行してアップロード
 */
function uploadMultipleImages(images) {
    return __awaiter(this, void 0, void 0, function () {
        var uploadPromises;
        return __generator(this, function (_a) {
            uploadPromises = images.map(function (_a) {
                var url = _a.url, fileName = _a.fileName, artistName = _a.artistName;
                return uploadImageToS3(url, fileName, artistName);
            });
            return [2 /*return*/, Promise.all(uploadPromises)];
        });
    });
}
exports.uploadMultipleImages = uploadMultipleImages;
/**
 * ファイル名を生成（URLから）
 */
function generateFileNameFromUrl(url) {
    try {
        var urlParts = new URL(url);
        var pathParts = urlParts.pathname.split("/");
        var lastPart = pathParts[pathParts.length - 1];
        // 拡張子がない場合は.jpgを追加
        if (!lastPart.includes(".")) {
            return "".concat(lastPart, ".jpg");
        }
        return lastPart;
    }
    catch (_a) {
        // URLが無効な場合はタイムスタンプを使用
        return "image_".concat(Date.now(), ".jpg");
    }
}
exports.generateFileNameFromUrl = generateFileNameFromUrl;
