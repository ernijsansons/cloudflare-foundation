import { z } from 'zod';

// Helper to coerce strings to arrays
const stringToArray = (val: unknown) => {
	if (Array.isArray(val)) return val;
	if (typeof val === 'string') return [val];
	return undefined;
};

// Helper to coerce objects to arrays
const objectToArray = (val: unknown) => {
	if (Array.isArray(val)) return val;
	if (val && typeof val === 'object') return [val];
	return undefined;
};

// Helper to coerce numbers to strings
const numberToString = (val: unknown) => {
	if (typeof val === 'number') return String(val);
	if (typeof val === 'string') return val;
	return undefined;
};

// More lenient PainPointSchema - accepts either string or full object
export const PainPointSchema = z.union([
	z.string(),
	z.object({
		description: z.string().nullish(),
		severity: z.enum(['hair_on_fire', 'high', 'medium', 'nice_to_have']).nullish(),
		exactQuote: z.string().nullish(),
		source: z.string().nullish()
	})
]);

// More lenient WateringHoleSchema - type defaults to "other" if not provided
export const WateringHoleSchema = z.object({
	type: z
		.enum(['subreddit', 'forum', 'slack', 'discord', 'newsletter', 'podcast', 'twitter', 'other'])
		.default('other'),
	name: z.string().nullish(),
	url: z.string().nullish(),
	memberCount: z.preprocess(numberToString, z.string().nullish())
});

export const IdealCustomerProfileSchema = z.object({
	demographics: z
		.object({
			jobTitle: z.string().nullish(),
			companySize: z.string().nullish(),
			industry: z.string().nullish()
		})
		.nullish(),
	psychographics: z
		.object({
			values: z.preprocess(stringToArray, z.array(z.string()).nullish()),
			fears: z.preprocess(stringToArray, z.array(z.string()).nullish()),
			aspirations: z.preprocess(stringToArray, z.array(z.string()).nullish()),
			identity: z.string().nullish()
		})
		.nullish(),
	painPoints: z.preprocess(objectToArray, z.array(PainPointSchema).nullish()),
	buyingTriggers: z.preprocess(stringToArray, z.array(z.string()).nullish()),
	currentSolutions: z.preprocess(
		objectToArray,
		z
			.array(
				z.object({
					tool: z.string().nullish(),
					whatTheyPay: z.string().nullish(),
					whatTheyHate: z.string().nullish()
				})
			)
			.nullish()
	),
	switchingCosts: z.string().nullish(),
	wateringHoles: z.preprocess(objectToArray, z.array(WateringHoleSchema).nullish()),
	searchBehavior: z.preprocess(stringToArray, z.array(z.string()).nullish()),
	willingnessToPay: z
		.object({
			min: z.number().nullish(),
			max: z.number().nullish(),
			currency: z.string().default('USD'),
			evidence: z.string().nullish()
		})
		.nullish(),
	decisionProcess: z
		.object({
			whoDecides: z.string().nullish(),
			whoInfluences: z.string().nullish(),
			timeline: z.string().nullish()
		})
		.nullish()
});

export const CustomerLanguageSchema = z
	.object({
		exactWords: z.preprocess(stringToArray, z.array(z.string()).nullish()),
		phrases: z.preprocess(stringToArray, z.array(z.string()).nullish()),
		metaphors: z.preprocess(stringToArray, z.array(z.string()).nullish())
	})
	.nullish();

export const JobToBeDoneSchema = z.object({
	functional: z.string().nullish(),
	emotional: z.string().nullish(),
	social: z.string().nullish()
});

export const CustomerIntelOutputSchema = z.object({
	idealCustomerProfiles: z.array(IdealCustomerProfileSchema).default([]),
	customerLanguage: CustomerLanguageSchema,
	jobsToBeDone: z.array(JobToBeDoneSchema).nullish(),
	unknowns: z.array(z.string()).default([]),
	/** Citations from community research (Reddit, forums, reviews) */
	citations: z
		.array(
			z.object({
				claim: z.string(),
				url: z.string(),
				date: z.string().nullish(),
				confidence: z.enum(['high', 'medium', 'low']).default('medium')
			})
		)
		.default([]),
	draftTasks: z.array(z.any()).default([])
});

export type CustomerIntelOutput = z.infer<typeof CustomerIntelOutputSchema>;
