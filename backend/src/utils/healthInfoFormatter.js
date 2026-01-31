"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCompleteContextForAI = exports.formatJournalContextForAI = exports.formatHealthInfoForAI = void 0;
var SEVERITY_LABELS = {
    mild: 'licht',
    moderate: 'matig',
    severe: 'ernstig',
};
/**
 * Format health information into a readable string for AI context
 */
var formatHealthInfoForAI = function (user) {
    if (!(user === null || user === void 0 ? void 0 : user.healthInfo)) {
        return '';
    }
    var _a = user.healthInfo, mentalHealth = _a.mentalHealth, physicalHealth = _a.physicalHealth, medications = _a.medications, therapies = _a.therapies;
    var parts = [];
    // Mental health conditions
    if (mentalHealth && mentalHealth.length > 0) {
        var mentalConditions = mentalHealth.map(function (item) {
            var conditionText = item.type
                ? "".concat(item.condition, " (").concat(item.type, ")")
                : item.condition;
            var severity = SEVERITY_LABELS[item.severity] || item.severity;
            return "- ".concat(conditionText, " (ernst: ").concat(severity, ")");
        }).join('\n');
        parts.push("Mentale gezondheid:\n".concat(mentalConditions));
    }
    // Physical health conditions
    if (physicalHealth && physicalHealth.length > 0) {
        var physicalConditions = physicalHealth.map(function (item) {
            var conditionText = item.type
                ? "".concat(item.condition, " (").concat(item.type, ")")
                : item.condition;
            var severity = SEVERITY_LABELS[item.severity] || item.severity;
            return "- ".concat(conditionText, " (ernst: ").concat(severity, ")");
        }).join('\n');
        parts.push("Fysieke gezondheid:\n".concat(physicalConditions));
    }
    // Medications
    if (medications && medications.length > 0) {
        parts.push("Medicatie: ".concat(medications.join(', ')));
    }
    // Therapies
    if (therapies && therapies.length > 0) {
        parts.push("Therapie\u00EBn: ".concat(therapies.join(', ')));
    }
    if (parts.length === 0) {
        return '';
    }
    return "\n\nGezondheidsinformatie van de gebruiker:\n".concat(parts.join('\n\n'), "\n\nGebruik deze informatie om context te geven aan je gesprekken. Wees empathisch en begripvol over deze condities. Verwijs er alleen naar als het relevant is voor het gesprek.");
};
exports.formatHealthInfoForAI = formatHealthInfoForAI;
/**
 * Format journal entries into a readable string for AI context
 */
var formatJournalContextForAI = function (entries) {
    if (!entries || entries.length === 0) {
        return '';
    }
    var sentimentLabels = {
        positive: 'positief',
        neutral: 'neutraal',
        negative: 'negatief',
        mixed: 'gemengd',
    };
    var entrySummaries = entries.map(function (entry) {
        var _a, _b;
        var date = new Date(entry.createdAt).toLocaleDateString('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
        var sentiment = ((_a = entry.aiInsights) === null || _a === void 0 ? void 0 : _a.sentiment) ? sentimentLabels[entry.aiInsights.sentiment] : '';
        var themes = (((_b = entry.aiInsights) === null || _b === void 0 ? void 0 : _b.themes) && entry.aiInsights.themes.length > 0)
            ? entry.aiInsights.themes.join(', ')
            : '';
        var summary = "- ".concat(date, ": Stemming ").concat(entry.mood, "/10");
        if (sentiment)
            summary += " (".concat(sentiment, ")");
        if (themes)
            summary += ". Thema's: ".concat(themes);
        summary += "\n  \"".concat(entry.content.substring(0, 200)).concat(entry.content.length > 200 ? '...' : '', "\"");
        return summary;
    }).join('\n\n');
    return "\n\nRecente dagboekentries van de gebruiker:\n".concat(entrySummaries, "\n\nJe kunt naar deze entries verwijzen als dat relevant is voor het gesprek. Bijvoorbeeld: \"Ik zag in je dagboek dat je vorige week schreef over...\" Wees subtiel en empathisch wanneer je verwijst naar persoonlijke reflecties.");
};
exports.formatJournalContextForAI = formatJournalContextForAI;
/**
 * Combine health info and journal context for complete AI context
 */
var formatCompleteContextForAI = function (user, journalEntries) {
    var healthContext = (0, exports.formatHealthInfoForAI)(user);
    var journalContext = journalEntries ? (0, exports.formatJournalContextForAI)(journalEntries) : '';
    return healthContext + journalContext;
};
exports.formatCompleteContextForAI = formatCompleteContextForAI;
