import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors({ origin: true }));

// Initialize Gemini AI
const config = functions.config() as any;
const geminiApiKey = config.gemini?.key;
if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not found in Firebase config');
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Test route
app.get('/', (req: express.Request, res: express.Response) => {
    res.json({ message: 'API is working' });
});

// Define metrics that only support annual (FY) periods
const ANNUAL_ONLY_METRICS = new Set(['key-metrics', 'ratios']);

// Define valid endpoints
const VALID_ENDPOINTS = {
    // Basic data
    quote: '/quote',
    quote_short: '/quote-short',
    search: '/search',
    profile: '/profile',
    
    // Financial statements (limited to 5 periods)
    'income-statement': '/income-statement',
    'balance-sheet-statement': '/balance-sheet-statement',
    'cash-flow-statement': '/cash-flow-statement',
    
    // Metrics and ratios (FY periods only)
    'key-metrics': '/key-metrics',
    'ratios': '/ratios'
} as const;

type EndpointType = keyof typeof VALID_ENDPOINTS;

// List of fields that should NOT be formatted as percentages
const NON_PERCENT_FIELDS = new Set([
    'eps', 'epsdiluted', 'weightedAverageShsOut', 'weightedAverageShsOutDil',
    'netIncomePerShare', 'operatingCashFlowPerShare', 'freeCashFlowPerShare',
    'cashPerShare', 'bookValuePerShare', 'tangibleBookValuePerShare',
    'shareholdersEquityPerShare', 'interestDebtPerShare', 'marketCap',
    'enterpriseValue', 'workingCapital', 'tangibleAssetValue', 'netCurrentAssetValue',
    'investedCapital', 'averageReceivables', 'averagePayables', 'averageInventory',
    'capexPerShare', 'grahamNumber', 'grahamNetNet','netIncomePerShare','revenuePerShare',
    'operatingCashFlowPerShare','freeCashFlowPerShare','cashPerShare','bookValuePerShare','tangibleBookValuePerShare',
    'shareholdersEquityPerShare','interestDebtPerShare',
    // Shares
    'weightedAverageShsOut', 'weightedAverageShsOutDil',
    // TTM per-share fields
    'revenuePerShareTTM','netIncomePerShareTTM',
    'operatingCashFlowPerShareTTM', 'freeCashFlowPerShareTTM', 'cashPerShareTTM', 'bookValuePerShareTTM',
    'tangibleBookValuePerShareTTM', 'shareholdersEquityPerShareTTM', 'interestDebtPerShareTTM',
    'capexPerShareTTM', 'capexPerShareTTM', 'capexPerShareTTM',
    // TTM large dollar value fields
    'marketCapTTM', 'enterpriseValueTTM', 'workingCapitalTTM', 'tangibleAssetValueTTM', 'netCurrentAssetValueTTM',
    'investedCapitalTTM', 'averageReceivablesTTM', 'averagePayablesTTM', 'averageInventoryTTM',
    'marketCapTTM', 'enterpriseValueTTM', 'workingCapitalTTM', 'tangibleAssetValueTTM', 'netCurrentAssetValueTTM',
    'investedCapitalTTM', 'averageReceivablesTTM', 'averagePayablesTTM', 'averageInventoryTTM',
]);

// Fields that should be formatted as multiples (plain numbers, not percentages)
const MULTIPLE_FIELDS = new Set([
    // Metrics multiples
    'peratio', 'pricetosalesratio', 'pocfratio', 'pfcfratio', 'pbratio', 'ptbratio',
    'evtosales', 'enterprisevalueoverebitda', 'evtooperatingcashflow', 'evtofreecashflow',
    'netdebtoebitda', 'currentratio', 'incomequality', 'interestcoverage',
    'daysofsalesoutstanding', 'dayspayablesoutstanding', 'daysofinventoryonhand',
    'receivablesturnover', 'payablesturnover', 'inventoryturnover',
    'debttoequity', 'debttoassets', 'pocfratio',
    // TTM multiples
    'peratiottm', 'pricetosalesratiottm', 'poctratiottm', 'pfcfratiottm', 'pbratiottm', 'ptbratiottm',
    'evtosalesttm', 'enterprisevalueoverebitdattm', 'evtooperatingcashflowttm', 'evtofreecashflowttm',
    'netdebtoebitdattm', 'currentratiottm', 'incomequalityttm', 'interestcoveragettm',
    'daysofsalesoutstandingttm', 'dayspayablesoutstandingttm', 'daysofinventoryonhandttm',
    'receivablesturnoverttm', 'payablesturnoverttm', 'inventoryturnoverttm',
    'debttoequityttm', 'debttoassetsttm', 'pocfratiottm',
    'pegratiottm', 'enterprisevaluemultiplettm',
    // Ratios endpoint fields (plain numbers, not percentages)
    'currentratio', 'quickratio', 'cashratio', 'interestcoverage', 'receivablesturnover', 'payablesturnover',
    'inventoryturnover', 'fixedassetturnover', 'assetturnover', 'operatingprofitratio',
    'pretaxprofitmargin', 'netprofitmargin', 'effectiveTaxRate', 'returnonassets', 'returnonequity',
    'returnoncapitalemployed', 'debttoequityratio', 'debttoassetsratio', 'longtermdebttocapitalization',
    'totaldebttocapitalization', 'companyequitymultiplier', 'pricebookratio', 'pricesalesratio',
    'priceearningsratio', 'pricefreecashflowratio', 'priceoperatingcashflowratio', 'pricecashflowratio',
    'priceearningsgrowthratio', 'enterprisevaluemultiple', 'pricefairvalue',
    'daysofsalesoutstanding', 'daysofinventoryoutstanding', 'operatingcycle', 'daysofpayablesoutstanding', 'cashconversioncycle',
    'debtequityratio', 'pricebookvalueratio', 'pricetobookratio', 'pricetofreecashflowratio', 'pricetooperatingcashflowratio', 'priceearningstogrowthratio',
    'pricetofreecashflowsratio', 'pricetooperatingcashflowsratio',
    // TTM ratio fields (plain numbers, not percentages)
    'currentratiottm', 'quickratiottm', 'cashratiottm',
    'daysofsalesoutstandingttm', 'daysofinventoryoutstandingttm', 'operatingcyclettm', 'daysofpayablesoutstandingttm', 'cashconversioncyclettm',
    'debtequityratiottm', 'pricebookvalueratiottm', 'pricetobookratiottm', 'pricetofreecashflowsratiottm', 'pricetooperatingcashflowsratiottm', 'priceearningstogrowthratiottm',
    'interestcoveragettm', 'receivablesturnoverttm', 'payablesturnoverttm', 'inventoryturnoverttm', 'fixedassetturnoverttm', 'assetturnoverttm',
    'companyequitymultiplierttm', 'pricecashflowratiottm', 'priceearningsratiottm', 'pricesalesratiottm', 'pricefairvaluettm', 'enterprisevaluemultiplierttm',
]);

// List of fields that should be formatted as dollar values (with commas)
const DOLLAR_FIELDS = new Set([
    // Cash Flow Statement fields
    'netcashprovidedbyoperatingactivities', 'changeinworkingcapital', 'deferredincometax',
    'stockbasedcompensation', 'accountsreceivable', 'inventory', 'accountspayable', 'otherworkingcapital',
    'othernoncashitems', 'netcashprovidedbyinvestingactivities', 'investmentsinpropertyplantandequipment',
    'purchaseofinvestments', 'saleofinvestments', 'netcashusedprovidedbyfinancingactivities', 'debtrepayment',
    'commonstockissued', 'commonstockrepurchased', 'dividendspaid', 'otherfinancingactivites',
    'effectofforexchangesoncash', 'netchangeincash', 'cashatendofperiod', 'cashatbeginningofperiod',
    'operatingcashflow', 'capitalexpenditure', 'freecashflow',
    // Balance Sheet Statement fields
    'cashandcashequivalents', 'shortterminvestments', 'netreceivables', 'inventory', 'othercurrentassets',
    'totalcurrentassets', 'propertyplantequipmentnet', 'goodwill', 'intangibles', 'longterminvestments',
    'taxassets', 'otherassets', 'totalassets', 'accountspayable', 'shorttermdebt', 'taxpayables',
    'deferredrevenue', 'othercurrentliabilities', 'totalcurrentliabilities', 'longtermdebt',
    'deferredrevenuenoncurrent', 'deferredtaxliabilitiesnoncurrent', 'othernoncurrentliabilities',
    'totalliabilities', 'capitalleaseobligations', 'commonstock', 'retainedearnings',
    'accumulatedothercomprehensiveincomeloss', 'othertotalstockholdersequity', 'totalstockholdersequity',
    'totalliabilitiesandstockholdersequity',
    // Income Statement (already present, but repeated for clarity)
    'revenue', 'costofrevenue', 'grossprofit', 'researchanddevelopmentexpenses',
    'generalandadministrativeexpenses', 'sellingandmarketingexpenses',
    'sellinggeneralandadministrativeexpenses', 'otherexpenses', 'operatingexpenses',
    'costandexpenses', 'interestincome', 'interestexpense', 'depreciationandamortization',
    'ebitda', 'operatingincome', 'totalotherincomeexpensesnet', 'incomebeforetax',
    'incometaxexpense', 'netincome',
    // Quote metric fields (except eps, sharesoutstanding, changespercentage)
    'price', 'dayhigh', 'daylow', 'yearhigh', 'yearlow', 'marketcap', 'priceavg50', 'priceavg200',
    'previousclose', 'open', 'volume', 'avgvolume', 'pe',
    // Other common fields
    'marketcap', 'enterprisevalue', 'workingcapital', 'tangibleassetvalue',
    'netcurrentassetvalue', 'investedcapital', 'averagereceivables', 'averagepayables',
    'averageinventory', 'capexpershare', 'grahamnumber', 'grahamnetnet','netincomepershare','revenuepershare',
    'operatingcashflowpershare','freecashflowpershare','cashpershare','bookvaluepershare','tangiblebookvaluepershare',
    'shareholdersequitypershare','interestdebtpershare',
    // Shares
    'weightedAverageShsOut', 'weightedAverageShsOutDil',
    // TTM per-share fields (dollar formatting)
    'revenuepersharettm', 'netincomepersharettm',
    'operatingcashflowpersharettm', 'freecashflowpersharettm', 'cashpersharettm', 'bookvaluepersharettm',
    'tangiblebookvaluepersharettm', 'shareholdersequitypersharettm', 'interestdebtpersharettm',
    'capexpersharettm',
    // TTM large dollar value fields
    'marketcapttm', 'enterprisevaluettm', 'workingcapitalttm', 'tangibleassetvaluettm', 'netcurrentassetvaluettm',
    'investedcapitalttm', 'averagereceivablesttm', 'averagepayablesttm', 'averageinventoryttm'
]);

// Helper function to check if a key should be formatted as a dollar value
function isDollarField(key?: string): boolean {
    if (!key) return false;
    return DOLLAR_FIELDS.has(key.toLowerCase().replace(/_/g, ''));
}

// Helper function to check if a key should NOT be formatted as a percentage (unless it's a growth field)
function isNonPercentField(key?: string): boolean {
    if (!key) return false;
    const lower = key.toLowerCase();
    if (lower.startsWith('growth')) return false; // growth fields should always be percent
    if (NON_PERCENT_FIELDS.has(lower)) return true;
    // Exclude any field containing eps or shsout (case-insensitive), unless it's a growth field
    return (lower.includes('eps') || lower.includes('shsout'));
}

// Helper function to determine decimal places for small numbers
function getDecimalPlaces(num: number): number {
    const absPercent = Math.abs(num * 100);
    if (absPercent >= 0.01) return 2;
    // Show at least two significant digits for very small numbers
    const asString = absPercent.toPrecision(2);
    const decimalPart = asString.split('.')[1] || '';
    return decimalPart.length > 2 ? decimalPart.length : 4;
}

// Helper function to format numbers with commas as thousand separators
function formatWithCommas(num: number): string {
    return num.toLocaleString('en-US');
}

// Helper function to convert numbers to percentage strings, format dollars, etc.
function percentifyValues(obj: any, parentKey?: string): any {
    if (Array.isArray(obj)) {
        return obj.map(item => percentifyValues(item));
    }
    if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = percentifyValues(value, key);
        }
        return result;
    }
    if (typeof obj === 'number') {
        // Format as dollar value with commas if field matches
        if (isDollarField(parentKey)) {
            if (Number.isInteger(obj)) {
                return formatWithCommas(obj);
            } else {
                return formatWithCommas(Number(obj.toFixed(2)));
            }
        }
        // Format as plain number for multiples/ratios
        if (MULTIPLE_FIELDS.has((parentKey || '').toLowerCase())) {
            return Number(obj.toFixed(2));
        }
        // Format as percent if needed
        if (!Number.isInteger(obj) && !isNonPercentField(parentKey)) {
            const decimalPlaces = getDecimalPlaces(obj);
            return `${(obj * 100).toFixed(decimalPlaces)}%`;
        }
        // Default: round decimals for non-percent fields
        if (!Number.isInteger(obj) && isNonPercentField(parentKey)) {
            return Number(obj.toFixed(2));
        }
    }
    return obj;
}

// Specialized formatting for quote metric
function formatQuoteData(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(formatQuoteData);
    }
    if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'number') {
                if (key.toLowerCase() === 'changespercentage') {
                    result[key] = value.toFixed(2) + '%';
                } else if (key.toLowerCase() === 'sharesoutstanding') {
                    result[key] = formatWithCommas(value);
                } else if (key.toLowerCase() === 'eps') {
                    result[key] = value;
                } else {
                    // Format large numbers with commas, keep decimals for price fields
                    if ([
                        'price', 'dayhigh', 'daylow', 'yearhigh', 'yearlow', 'marketcap', 'priceavg50', 'priceavg200',
                        'volume', 'avgvolume', 'pe', 'previousclose', 'open'
                    ].includes(key.toLowerCase())) {
                        result[key] = Number.isInteger(value) ? formatWithCommas(value) : value.toLocaleString('en-US', { maximumFractionDigits: 2 });
                    } else {
                        result[key] = value;
                    }
                }
            } else {
                result[key] = value;
            }
        }
        return result;
    }
    return obj;
}

// Helper function to extract JSON from markdown response
function extractJsonFromMarkdown(text: string): string {
    // Remove markdown code block markers
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    return jsonMatch ? jsonMatch[1] : text;
}

// FMP API route
// FMP API routes
app.get('/api/fmp/stocks/:symbol', async (req: express.Request, res: express.Response) => {
    try {
        const { symbol } = req.params;
        const baseUrl = 'https://financialmodelingprep.com/api/v3';
        const apiKey = functions.config().fmp?.key;
        
        if (!apiKey) {
            console.error('FMP_API_KEY not found in Firebase config');
            res.status(500).json({ error: 'API key not configured' });
            return;
        }

        const queryParams = new URLSearchParams();
        queryParams.append('apikey', apiKey);
        queryParams.append('limit', '5');

        const url = `${baseUrl}/quote/${symbol}?${queryParams.toString()}`;
        const response = await axios.get(url);
        
        if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
            res.status(404).json({ 
                error: 'No data found',
                details: `No quote data available for symbol ${symbol}`
            });
            return;
        }

        res.json(formatQuoteData(response.data));
    } catch (error: any) {
        console.error('Error fetching stock quote:', error);
        res.status(500).json({ error: 'Failed to fetch stock quote' });
    }
});

app.get('/api/fmp/:endpoint/:symbol', async (req: express.Request, res: express.Response) => {
    try {
        const { endpoint, symbol } = req.params;
        const period = req.query.period as 'annual' | 'quarterly';
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

        const validEndpoint = endpoint as EndpointType;
        if (!VALID_ENDPOINTS[validEndpoint]) {
            res.status(400).json({ 
                error: 'Invalid endpoint',
                message: `Invalid endpoint: ${endpoint}`,
                validEndpoints: Object.keys(VALID_ENDPOINTS)
            });
            return;
        }

        // Check if trying to use quarterly period for annual-only endpoints
        if (ANNUAL_ONLY_METRICS.has(validEndpoint) && period === 'quarterly') {
            res.status(400).json({
                error: 'Invalid period',
                message: `The ${validEndpoint} endpoint only supports annual periods`,
                validPeriods: ['annual']
            });
            return;
        }

        const baseUrl = 'https://financialmodelingprep.com/api/v3';
        const apiKey = functions.config().fmp?.key;
        
        if (!apiKey) {
            console.error('FMP_API_KEY not found in Firebase config');
            res.status(500).json({ error: 'API key not configured' });
            return;
        }

        const queryParams = new URLSearchParams();
        queryParams.append('apikey', apiKey);
        queryParams.append('period', period || 'annual');
        queryParams.append('limit', Math.min(limit, 5).toString());

        const url = `${baseUrl}${VALID_ENDPOINTS[validEndpoint]}/${symbol}?${queryParams.toString()}`;

        console.log('API Request:', {
            url,
            endpoint,
            period,
            limit,
            queryParams: Object.fromEntries(queryParams.entries())
        });

        const response = await axios.get(url);
        
        if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
            res.status(404).json({ 
                error: 'No data found',
                details: `No ${validEndpoint} data available for symbol ${symbol}`
            });
            return;
        }

        res.json(percentifyValues(response.data));
    } catch (error: any) {
        console.error(`Error fetching ${req.params.endpoint}:`, error);
        res.status(500).json({ error: `Failed to fetch ${req.params.endpoint}` });
    }
});

// Finnhub Earnings Calendar API endpoint
app.get('/api/earnings', async (req: express.Request, res: express.Response) => {
    try {
        const { symbol, from, to } = req.query;
        const config = functions.config() as any;
        const apiKey = config.news?.key;
        
        console.log('Using Finnhub API Key:', apiKey);
        
        if (!apiKey) {
            console.error('FINNHUB_API_KEY not found in Firebase config');
            res.status(500).json({ error: 'API key not configured' });
            return;
        }

        // Default to next 1 year if no date range provided
        const fromDate = from || new Date().toISOString().split('T')[0]; // Today in YYYY-MM-DD
        const toDate = to || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 year from now

        console.log(`Making request to Finnhub Earnings Calendar API for symbol: ${symbol}`);
        const response = await axios.get(
            'https://finnhub.io/api/v1/calendar/earnings',
            {
                params: {
                    symbol: symbol,
                    from: fromDate,
                    to: toDate
                },
                headers: {
                    'X-Finnhub-Token': apiKey
                }
            }
        );

        // Format earnings calendar if present (keep code minimal and inline)
        if (response.data && Array.isArray(response.data.earningsCalendar)) {
            response.data.earningsCalendar = response.data.earningsCalendar.map((entry: any) => ({
                ...entry,
                revenueActual: typeof entry.revenueActual === 'number' ? entry.revenueActual.toLocaleString('en-US') : entry.revenueActual,
                revenueEstimate: typeof entry.revenueEstimate === 'number' ? entry.revenueEstimate.toLocaleString('en-US') : entry.revenueEstimate,
                epsActual: typeof entry.epsActual === 'number' ? Number(entry.epsActual.toFixed(2)) : entry.epsActual,
                epsEstimate: typeof entry.epsEstimate === 'number' ? Number(entry.epsEstimate.toFixed(2)) : entry.epsEstimate,
            }));
        }

        res.json(response.data);
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Finnhub Earnings Calendar API Error:', errorMessage);
        res.status(500).json({ error: 'Failed to fetch earnings data', details: errorMessage });
    }
});

// News API endpoint using Finnhub
app.get('/api/news', async (req: express.Request, res: express.Response) => {
    try {
        const { symbol } = req.query;
        const config = functions.config() as any;
        const apiKey = config.news?.key;
        
        console.log('Using Finnhub API Key:', apiKey);
        
        if (!apiKey) {
            console.error('FINNHUB_API_KEY not found in Firebase config');
            res.status(500).json({ error: 'API key not configured' });
            return;
        }

        // Get news from last 7 days
        const toDate = Math.floor(Date.now() / 1000);
        const fromDate = toDate - (7 * 24 * 60 * 60); // 7 days ago

        console.log(`Making request to Finnhub API for symbol: ${symbol}`);
        const response = await axios.get(
            `https://finnhub.io/api/v1/company-news`,
            {
                params: {
                    symbol: symbol,
                    from: new Date(fromDate * 1000).toISOString().split('T')[0],
                    to: new Date(toDate * 1000).toISOString().split('T')[0]
                },
                headers: {
                    'X-Finnhub-Token': apiKey
                }
            }
        );
        res.json(response.data);
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Finnhub API Error:', errorMessage);
        res.status(500).json({ error: 'Failed to fetch news data', details: errorMessage });
    }
});

// Market News API endpoint using Finnhub
app.get('/api/news/market', async (req: express.Request, res: express.Response) => {
    try {
        const config = functions.config() as any;
        const apiKey = config.news?.key;

        if (!apiKey) {
            console.error('FINNHUB_API_KEY not found in Firebase config');
            res.status(500).json({ error: 'API key not configured' });
            return;
        }

        // Default to 'general' category, allow override via query param
        const category = req.query.category || 'general';
        const minId = req.query.minId || 0;

        const response = await axios.get('https://finnhub.io/api/v1/news', {
            params: {
                category,
                minId,
                token: apiKey
            }
        });
        res.json(response.data);
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Finnhub Market News API Error:', errorMessage);
        res.status(500).json({ error: 'Failed to fetch market news', details: errorMessage });
    }
});

// Gemini API endpoints
app.post('/api/gemini/moat-risks', async (req, res) => {
    try {
        const { symbol, companyData } = req.body;
        console.log('Received request:', { symbol, companyData });
        
        const prompt = `Analyze the competitive moat and investment risks for ${symbol} based on this data: ${JSON.stringify(companyData)}.
            Format the response as JSON with 'moat' and 'risks' arrays.`;
        console.log('Generated prompt:', prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('Gemini response:', text);

        const cleanJson = extractJsonFromMarkdown(text);
        console.log('Cleaned JSON:', cleanJson);

        const parsedResponse = JSON.parse(cleanJson);
        console.log('Parsed response:', parsedResponse);

        res.json(parsedResponse);
    } catch (error: any) {
        console.error('Error in moat-risks endpoint:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Failed to analyze moat and risks', details: errorMessage });
    }
});

app.post('/api/gemini/bias-detection', async (req, res) => {
    try {
        const { ticker, action, shares, price, emotionalState, questions } = req.body;
        
        const prompt = `Analyze potential trading biases for: ${ticker}, ${action}, ${shares} shares at $${price}.
            Emotional state: ${emotionalState}. Questions: ${JSON.stringify(questions)}.
            Return JSON with 'biases' array and 'score' number.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanJson = extractJsonFromMarkdown(text);
        res.json(JSON.parse(cleanJson));
    } catch (error: any) {
        console.error('Error in bias-detection endpoint:', error);
        res.status(500).json({ error: 'Failed to detect biases', details: error.message });
    }
});

app.post('/api/gemini/summarize', async (req, res) => {
    try {
        const { symbol, quarter, year, transcript } = req.body;
        
        const prompt = `Summarize key points from ${symbol}'s ${quarter} ${year} earnings call transcript: ${transcript}.
            Return JSON with 'highlights' array and 'sentiment' string.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanJson = extractJsonFromMarkdown(text);
        res.json(JSON.parse(cleanJson));
    } catch (error: any) {
        console.error('Error in summarize endpoint:', error);
        res.status(500).json({ error: 'Failed to summarize transcript', details: error.message });
    }
});

app.post('/api/gemini/score', async (req, res) => {
    try {
        const { title, content, source } = req.body;
        
        const prompt = `Score this news article:
            Title: ${title}
            Content: ${content}
            Source: ${source}
            
            Calculate score (0-100%) based on:
            - Fundamentals focus (50%): How much does it discuss actual business metrics and facts?
            - Source credibility (30%): Is this a reputable financial news source?
            - Tone (20%): Is the language neutral and analytical vs sensational?
            
            Return JSON with 'score' number and 'breakdown' object showing component scores.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanJson = extractJsonFromMarkdown(text);
        res.json(JSON.parse(cleanJson));
    } catch (error: any) {
        console.error('Error in score endpoint:', error);
        res.status(500).json({ error: 'Failed to score article', details: error.message });
    }
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
