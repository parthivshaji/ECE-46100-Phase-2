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
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const FileUpload = () => {
    const [file, setFile] = (0, react_1.useState)(null);
    const [urls, setUrls] = (0, react_1.useState)([]);
    const [results, setResults] = (0, react_1.useState)(null);
    const handleFileChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);
        }
    };
    const handleFileRead = () => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                var _a;
                const content = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
                const parsedUrls = content.split('\n').map(line => line.trim()).filter(Boolean);
                setUrls(parsedUrls);
            };
            reader.readAsText(file);
        }
    };
    const calculateMetrics = () => __awaiter(void 0, void 0, void 0, function* () {
        if (urls.length > 0) {
            try {
                const response = yield fetch('/api/calculate-metrics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ urls }),
                });
                const data = yield response.json();
                setResults(data);
            }
            catch (error) {
                console.error("Error calculating metrics:", error);
            }
        }
    });
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { children: "Upload URL File" }), (0, jsx_runtime_1.jsx)("input", { type: "file", accept: ".txt", onChange: handleFileChange }), (0, jsx_runtime_1.jsx)("button", { onClick: handleFileRead, children: "Read File" }), urls.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "URLs:" }), (0, jsx_runtime_1.jsx)("ul", { children: urls.map((url, index) => ((0, jsx_runtime_1.jsx)("li", { children: url }, index))) }), (0, jsx_runtime_1.jsx)("button", { onClick: calculateMetrics, children: "Calculate Metrics" })] })), results && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { children: "Metrics Results:" }), (0, jsx_runtime_1.jsx)("pre", { children: JSON.stringify(results, null, 2) })] }))] }));
};
exports.default = FileUpload;
