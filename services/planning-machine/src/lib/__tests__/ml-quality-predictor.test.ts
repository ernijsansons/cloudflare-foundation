/**
 * ML Quality Predictor Tests
 */

import { describe, it, expect } from 'vitest';
import {
  extractFeatures,
  QualityPredictionModel,
  trainTestSplit,
  type TrainingExample,
  type ArtifactFeatures,
  type QualityScore,
} from '../ml-quality-predictor';

describe('ML Quality Predictor', () => {
  describe('Feature Extraction', () => {
    it('should extract basic text features', () => {
      const content = {
        marketSize: '$5.2B TAM in enterprise software',
        analysis: 'Strong growth potential in cloud computing.',
      };

      const features = extractFeatures(content, 85, 8.5, 'opportunity', 5);

      expect(features.contentLength).toBeGreaterThan(0);
      expect(features.wordCount).toBeGreaterThan(0);
      expect(features.sentenceCount).toBeGreaterThan(0);
      expect(features.avgSentenceLength).toBeGreaterThan(0);
    });

    it('should calculate citation density correctly', () => {
      const content = { text: 'a '.repeat(100) }; // 100 words

      const features = extractFeatures(content, 85, 8.5, 'opportunity', 5);

      // 5 citations / 100 words = 5 citations per 100 words
      expect(features.citationDensity).toBeCloseTo(5, 1);
    });

    it('should handle content with no citations', () => {
      const content = { text: 'Sample text without citations' };

      const features = extractFeatures(content, 85, 8.5, 'opportunity', 0);

      expect(features.citationCount).toBe(0);
      expect(features.citationDensity).toBe(0);
    });

    it('should include consensus and completeness scores', () => {
      const content = { data: 'test' };

      const features = extractFeatures(content, 92, 9.2, 'opportunity', 3);

      expect(features.consensusScore).toBe(92);
      expect(features.completenessScore).toBe(9.2);
    });

    it('should include revision and review counts', () => {
      const content = { data: 'test' };

      const features = extractFeatures(
        content,
        85,
        8.5,
        'opportunity',
        5,
        1500, // executionTimeMs
        2, // revisionCount
        1 // operatorReviewCount
      );

      expect(features.executionTimeMs).toBe(1500);
      expect(features.revisionCount).toBe(2);
      expect(features.operatorReviewCount).toBe(1);
    });

    it('should handle different phases', () => {
      const content = { data: 'test' };

      const oppFeatures = extractFeatures(content, 85, 8.5, 'opportunity', 3);
      const solFeatures = extractFeatures(content, 85, 8.5, 'solution', 3);

      expect(oppFeatures.phase).toBe('opportunity');
      expect(solFeatures.phase).toBe('solution');
    });
  });

  describe('Quality Prediction Model', () => {
    const createMockTrainingData = (count: number): TrainingExample[] => {
      const examples: TrainingExample[] = [];

      for (let i = 0; i < count; i++) {
        const score = 50 + (i % 50); // Scores from 50-100

        const features: ArtifactFeatures = {
          contentLength: 500 + i * 10,
          wordCount: 100 + i * 2,
          sentenceCount: 10 + i,
          avgSentenceLength: 10 + (i % 5),
          citationCount: 3 + (i % 7),
          citationDensity: 3 + (i % 5),
          avgCitationLength: 50,
          uniqueSourceCount: 3 + (i % 5),
          consensusScore: score * 0.9,
          modelAgreementVariance: 100 - score * 0.9,
          completenessScore: (score / 10) * 0.9,
          requiredFieldsFilled: 10,
          optionalFieldsFilled: 5,
          phase: 'opportunity',
          executionTimeMs: 1000 + i * 100,
          revisionCount: i % 3,
          operatorReviewCount: i % 2,
        };

        const actualScore: QualityScore = {
          overallScore: score,
          evidenceCoverage: score / 10,
          factualAccuracy: score / 10,
          completeness: score / 10,
          citationQuality: score / 10,
          reasoningDepth: score / 10,
          tier: score >= 90 ? 'excellent' : score >= 85 ? 'good' : 'acceptable',
          productionReady: score >= 85,
        };

        examples.push({
          features,
          actualScore,
          timestamp: Date.now() + i,
        });
      }

      return examples;
    };

    it('should train on valid dataset', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(20);

      expect(() => model.train(trainingData)).not.toThrow();
    });

    it('should throw error when training on empty dataset', () => {
      const model = new QualityPredictionModel();

      expect(() => model.train([])).toThrow('Cannot train on empty dataset');
    });

    it('should throw error when predicting without training', () => {
      const model = new QualityPredictionModel();
      const features = createMockTrainingData(1)[0].features;

      expect(() => model.predict(features)).toThrow('Model must be trained before prediction');
    });

    it('should make predictions after training', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(30);
      model.train(trainingData);

      const testFeatures = createMockTrainingData(1)[0].features;
      const prediction = model.predict(testFeatures);

      expect(prediction.predictedOverallScore).toBeGreaterThanOrEqual(0);
      expect(prediction.predictedOverallScore).toBeLessThanOrEqual(100);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should predict dimensional scores', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(25);
      model.train(trainingData);

      const testFeatures = createMockTrainingData(1)[0].features;
      const prediction = model.predict(testFeatures);

      const dims = prediction.predictedDimensionalScores;

      expect(dims.evidenceCoverage).toBeGreaterThanOrEqual(0);
      expect(dims.evidenceCoverage).toBeLessThanOrEqual(10);
      expect(dims.factualAccuracy).toBeGreaterThanOrEqual(0);
      expect(dims.factualAccuracy).toBeLessThanOrEqual(10);
      expect(dims.completeness).toBeGreaterThanOrEqual(0);
      expect(dims.completeness).toBeLessThanOrEqual(10);
      expect(dims.citationQuality).toBeGreaterThanOrEqual(0);
      expect(dims.citationQuality).toBeLessThanOrEqual(10);
      expect(dims.reasoningDepth).toBeGreaterThanOrEqual(0);
      expect(dims.reasoningDepth).toBeLessThanOrEqual(10);
    });

    it('should include model version in prediction', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(20);
      model.train(trainingData);

      const testFeatures = createMockTrainingData(1)[0].features;
      const prediction = model.predict(testFeatures);

      expect(prediction.modelVersion).toBe('1.0.0');
    });

    it('should predict higher scores for better features', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(40);
      model.train(trainingData);

      const lowQualityFeatures: ArtifactFeatures = {
        contentLength: 200,
        wordCount: 50,
        sentenceCount: 5,
        avgSentenceLength: 10,
        citationCount: 0,
        citationDensity: 0,
        avgCitationLength: 0,
        uniqueSourceCount: 0,
        consensusScore: 50,
        modelAgreementVariance: 50,
        completenessScore: 5.0,
        requiredFieldsFilled: 5,
        optionalFieldsFilled: 2,
        phase: 'opportunity',
        executionTimeMs: 2000,
        revisionCount: 3,
        operatorReviewCount: 2,
      };

      const highQualityFeatures: ArtifactFeatures = {
        contentLength: 2000,
        wordCount: 400,
        sentenceCount: 40,
        avgSentenceLength: 10,
        citationCount: 15,
        citationDensity: 3.75,
        avgCitationLength: 100,
        uniqueSourceCount: 12,
        consensusScore: 95,
        modelAgreementVariance: 5,
        completenessScore: 9.5,
        requiredFieldsFilled: 15,
        optionalFieldsFilled: 10,
        phase: 'opportunity',
        executionTimeMs: 1500,
        revisionCount: 0,
        operatorReviewCount: 0,
      };

      const lowPrediction = model.predict(lowQualityFeatures);
      const highPrediction = model.predict(highQualityFeatures);

      expect(highPrediction.predictedOverallScore).toBeGreaterThan(lowPrediction.predictedOverallScore);
    });

    it('should calculate confidence based on training data similarity', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(30);
      model.train(trainingData);

      // Test with features similar to training data
      const similarFeatures = trainingData[5].features;
      const similarPrediction = model.predict(similarFeatures);

      // Test with very different features
      const differentFeatures: ArtifactFeatures = {
        ...trainingData[0].features,
        consensusScore: 10,
        completenessScore: 1.0,
        citationCount: 100,
      };
      const differentPrediction = model.predict(differentFeatures);

      expect(similarPrediction.confidence).toBeGreaterThan(differentPrediction.confidence);
    });

    it('should have minimum confidence threshold', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(20);
      model.train(trainingData);

      const extremeFeatures: ArtifactFeatures = {
        contentLength: 50000,
        wordCount: 10000,
        sentenceCount: 1000,
        avgSentenceLength: 100,
        citationCount: 500,
        citationDensity: 50,
        avgCitationLength: 500,
        uniqueSourceCount: 300,
        consensusScore: 10,
        modelAgreementVariance: 90,
        completenessScore: 1.0,
        requiredFieldsFilled: 1,
        optionalFieldsFilled: 0,
        phase: 'opportunity',
        executionTimeMs: 50000,
        revisionCount: 10,
        operatorReviewCount: 10,
      };

      const prediction = model.predict(extremeFeatures);

      expect(prediction.confidence).toBeGreaterThanOrEqual(0.3); // Minimum 30%
    });
  });

  describe('Model Evaluation', () => {
    const createMockTrainingData = (count: number): TrainingExample[] => {
      const examples: TrainingExample[] = [];

      for (let i = 0; i < count; i++) {
        const score = 50 + (i % 50);

        const features: ArtifactFeatures = {
          contentLength: 500 + i * 10,
          wordCount: 100 + i * 2,
          sentenceCount: 10 + i,
          avgSentenceLength: 10,
          citationCount: 3 + (i % 7),
          citationDensity: 3,
          avgCitationLength: 50,
          uniqueSourceCount: 3,
          consensusScore: score * 0.9,
          modelAgreementVariance: 100 - score * 0.9,
          completenessScore: (score / 10) * 0.9,
          requiredFieldsFilled: 10,
          optionalFieldsFilled: 5,
          phase: 'opportunity',
          executionTimeMs: 1000,
          revisionCount: 0,
          operatorReviewCount: 0,
        };

        const actualScore: QualityScore = {
          overallScore: score,
          evidenceCoverage: score / 10,
          factualAccuracy: score / 10,
          completeness: score / 10,
          citationQuality: score / 10,
          reasoningDepth: score / 10,
          tier: score >= 90 ? 'excellent' : score >= 85 ? 'good' : 'acceptable',
          productionReady: score >= 85,
        };

        examples.push({ features, actualScore, timestamp: Date.now() });
      }

      return examples;
    };

    it('should calculate MAE (Mean Absolute Error)', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(50);
      model.train(trainingData.slice(0, 40));

      const testData = trainingData.slice(40);
      const metrics = model.evaluate(testData);

      expect(metrics.mae).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.mae).toBe('number');
    });

    it('should calculate RMSE (Root Mean Squared Error)', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(50);
      model.train(trainingData.slice(0, 40));

      const testData = trainingData.slice(40);
      const metrics = model.evaluate(testData);

      expect(metrics.rmse).toBeGreaterThanOrEqual(0);
      expect(metrics.rmse).toBeGreaterThanOrEqual(metrics.mae); // RMSE >= MAE always
    });

    it('should calculate R² (coefficient of determination)', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(50);
      model.train(trainingData.slice(0, 40));

      const testData = trainingData.slice(40);
      const metrics = model.evaluate(testData);

      expect(typeof metrics.r2).toBe('number');
      // R² can be negative for very poor models, so just check it's a number
    });

    it('should include sample count in metrics', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(60);
      model.train(trainingData.slice(0, 50));

      const testData = trainingData.slice(50);
      const metrics = model.evaluate(testData);

      expect(metrics.sampleCount).toBe(50);
    });

    it('should include last trained timestamp', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(40);
      model.train(trainingData.slice(0, 30));

      const testData = trainingData.slice(30);
      const metrics = model.evaluate(testData);

      expect(metrics.lastTrainedAt).toBeInstanceOf(Date);
      expect(metrics.lastTrainedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should throw error when evaluating on empty test set', () => {
      const model = new QualityPredictionModel();
      const trainingData = createMockTrainingData(20);
      model.train(trainingData);

      expect(() => model.evaluate([])).toThrow('Cannot evaluate on empty test set');
    });
  });

  describe('Train-Test Split', () => {
    it('should split data into train and test sets', () => {
      const examples: TrainingExample[] = [];
      for (let i = 0; i < 100; i++) {
        examples.push({
          features: {} as ArtifactFeatures,
          actualScore: {} as QualityScore,
          timestamp: Date.now(),
        });
      }

      const { train, test } = trainTestSplit(examples, 0.2);

      expect(train.length).toBe(80);
      expect(test.length).toBe(20);
    });

    it('should handle custom test ratio', () => {
      const examples: TrainingExample[] = [];
      for (let i = 0; i < 100; i++) {
        examples.push({
          features: {} as ArtifactFeatures,
          actualScore: {} as QualityScore,
          timestamp: Date.now(),
        });
      }

      const { train, test } = trainTestSplit(examples, 0.3);

      expect(train.length).toBe(70);
      expect(test.length).toBe(30);
    });

    it('should not lose any examples during split', () => {
      const examples: TrainingExample[] = [];
      for (let i = 0; i < 50; i++) {
        examples.push({
          features: {} as ArtifactFeatures,
          actualScore: {} as QualityScore,
          timestamp: Date.now(),
        });
      }

      const { train, test } = trainTestSplit(examples, 0.2);

      expect(train.length + test.length).toBe(examples.length);
    });

    it('should shuffle data during split', () => {
      const examples: TrainingExample[] = [];
      for (let i = 0; i < 100; i++) {
        examples.push({
          features: { contentLength: i } as ArtifactFeatures,
          actualScore: {} as QualityScore,
          timestamp: i,
        });
      }

      const { train, test } = trainTestSplit(examples, 0.2);

      // Check that train set is not just the first 80 elements
      const isShuffled = train.some((ex, i) => ex.timestamp !== i);
      expect(isShuffled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short content', () => {
      const content = { text: 'Hi' };

      const features = extractFeatures(content, 85, 8.5, 'opportunity', 0);

      expect(features.contentLength).toBeGreaterThan(0);
      expect(features.wordCount).toBeGreaterThan(0);
    });

    it('should handle very long content', () => {
      const content = { text: 'word '.repeat(10000) };

      const features = extractFeatures(content, 85, 8.5, 'opportunity', 50);

      expect(features.contentLength).toBeGreaterThan(50000);
      expect(features.wordCount).toBeGreaterThan(9000);
    });

    it('should handle zero consensus score', () => {
      const content = { text: 'test' };

      const features = extractFeatures(content, 0, 8.5, 'opportunity', 3);

      expect(features.consensusScore).toBe(0);
    });

    it('should handle maximum consensus score', () => {
      const content = { text: 'test' };

      const features = extractFeatures(content, 100, 10, 'opportunity', 10);

      expect(features.consensusScore).toBe(100);
      expect(features.completenessScore).toBe(10);
    });

    it('should clamp predictions to valid range', () => {
      const model = new QualityPredictionModel();
      const trainingData: TrainingExample[] = [];

      for (let i = 0; i < 20; i++) {
        trainingData.push({
          features: {
            contentLength: 1000,
            wordCount: 200,
            sentenceCount: 20,
            avgSentenceLength: 10,
            citationCount: 5,
            citationDensity: 2.5,
            avgCitationLength: 50,
            uniqueSourceCount: 5,
            consensusScore: 85,
            modelAgreementVariance: 15,
            completenessScore: 8.5,
            requiredFieldsFilled: 10,
            optionalFieldsFilled: 5,
            phase: 'opportunity',
            executionTimeMs: 1500,
            revisionCount: 0,
            operatorReviewCount: 0,
          },
          actualScore: {
            overallScore: 85,
            evidenceCoverage: 8.5,
            factualAccuracy: 8.5,
            completeness: 8.5,
            citationQuality: 8.5,
            reasoningDepth: 8.5,
            tier: 'good',
            productionReady: true,
          },
          timestamp: Date.now(),
        });
      }

      model.train(trainingData);

      const extremeFeatures: ArtifactFeatures = {
        contentLength: 100000,
        wordCount: 20000,
        sentenceCount: 2000,
        avgSentenceLength: 10,
        citationCount: 1000,
        citationDensity: 50,
        avgCitationLength: 200,
        uniqueSourceCount: 500,
        consensusScore: 100,
        modelAgreementVariance: 0,
        completenessScore: 10,
        requiredFieldsFilled: 20,
        optionalFieldsFilled: 20,
        phase: 'opportunity',
        executionTimeMs: 500,
        revisionCount: 0,
        operatorReviewCount: 0,
      };

      const prediction = model.predict(extremeFeatures);

      expect(prediction.predictedOverallScore).toBeLessThanOrEqual(100);
      expect(prediction.predictedOverallScore).toBeGreaterThanOrEqual(0);
    });
  });
});
