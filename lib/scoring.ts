export interface KeywordMetrics {
  search_volume?: number;
  current_position?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  relevance_score?: number;
  difficulty_score?: number;
}

export interface ContentMetrics {
  organic_sessions_30d?: number;
  avg_position?: number;
  clicks_30d?: number;
  impressions_30d?: number;
  aeo_citation_count?: number;
  published_at?: Date;
}

export interface ContentPerformanceTrend {
  sessions_trend: number; // -1 to 1 (negative = declining, positive = improving)
  position_trend: number; // -1 to 1 (negative = worsening, positive = improving)
  conversion_rate: number; // 0 to 1
  aeo_score: number; // 0 to 1
}

export function calculateOpportunityScore(metrics: KeywordMetrics): number {
  const relevance = (metrics.relevance_score || 0) / 100;
  const position = metrics.current_position || 50;

  // Position gap score: highest for positions 5-20 (striking distance)
  let positionGapScore = 0;
  if (position >= 5 && position <= 20) {
    positionGapScore = 1 - (Math.abs(position - 10) / 15); // Peaks at 10
  } else if (position > 20) {
    positionGapScore = (50 - Math.min(position, 50)) / 50;
  }

  // Volume normalized (assume max 10k searches/month)
  const volumeNormalized = Math.min((metrics.search_volume || 0) / 10000, 1);

  // CTR potential based on difficulty (lower difficulty = higher potential)
  const difficulty = (metrics.difficulty_score || 50) / 100;
  const ctrPotential = 1 - difficulty;

  // Impressions show search demand for the keyword
  const impressionsNormalized = Math.min((metrics.impressions || 0) / 1000, 1);

  const score =
    relevance * 0.4 +
    volumeNormalized * 0.2 +
    positionGapScore * 0.2 +
    impressionsNormalized * 0.1 +
    ctrPotential * 0.1;

  return Math.round(score * 100);
}

export function calculateContentHealthScore(
  metrics: ContentMetrics,
  performanceTrends?: ContentPerformanceTrend
): number {
  let score = 50; // Baseline

  // Session performance (0-30 points)
  const sessions = Math.min((metrics.organic_sessions_30d || 0) / 100, 1);
  score += sessions * 30;

  // Position (0-25 points): better positions = higher score
  const position = metrics.avg_position || 50;
  const positionScore = position <= 3 ? 25 : position <= 10 ? 20 : position <= 30 ? 10 : 0;
  score += positionScore;

  // AEO citations (0-20 points)
  const aeoCitations = Math.min((metrics.aeo_citation_count || 0) / 5, 1);
  score += aeoCitations * 20;

  // CTR effectiveness (0-15 points)
  if (metrics.impressions_30d && metrics.clicks_30d) {
    const ctr = metrics.clicks_30d / metrics.impressions_30d;
    const expectedCtr = position <= 3 ? 0.25 : position <= 10 ? 0.1 : 0.03;
    const ctrRatio = Math.min(ctr / expectedCtr, 1);
    score += ctrRatio * 15;
  }

  // Apply trends if available
  if (performanceTrends) {
    const trendAdjustment =
      performanceTrends.sessions_trend * 10 +
      performanceTrends.position_trend * 5 +
      performanceTrends.conversion_rate * 5 +
      performanceTrends.aeo_score * 5;

    score += trendAdjustment;
  }

  // Cap score between 0-100
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculatePositionTrend(
  previousPosition: number | null,
  currentPosition: number
): number {
  if (previousPosition === null || previousPosition === undefined) {
    return 0;
  }

  const positionChange = previousPosition - currentPosition;

  if (positionChange > 5) return 1; // Improved by 5+ spots
  if (positionChange > 0) return positionChange / 10; // Improved
  if (positionChange === 0) return 0; // No change
  if (positionChange < -5) return -1; // Dropped 5+ spots
  return positionChange / 10; // Dropped
}

export function calculateSessionTrend(
  previousSessions: number | null,
  currentSessions: number
): number {
  if (previousSessions === null || previousSessions === 0) {
    return currentSessions > 0 ? 0.5 : 0;
  }

  const growth = (currentSessions - previousSessions) / previousSessions;

  if (growth > 0.5) return 1; // 50%+ growth
  if (growth > 0) return growth; // Positive growth
  if (growth === 0) return 0; // No change
  if (growth < -0.5) return -1; // 50%+ decline
  return growth; // Negative growth
}

export function shouldRefreshContent(
  healthScore: number,
  daysOld: number,
  positionTrend: number,
  previousAEOCitations: number,
  currentAEOCitations: number
): boolean {
  // Refresh if health score is below 30
  if (healthScore < 30) return true;

  // Refresh if content is older than 60 days and position dropped
  if (daysOld > 60 && positionTrend < -0.3) return true;

  // Refresh if AEO citations were lost (went from cited to not cited)
  if (previousAEOCitations > 0 && currentAEOCitations === 0) return true;

  // Refresh if health score declined significantly
  if (healthScore < 40 && daysOld > 30) return true;

  return false;
}

export function prioritizeQueue(
  keywords: Array<{
    id: number;
    opportunity_score: number;
    status: string;
  }>
): Array<{ id: number; priority: number }> {
  // Sort by opportunity score descending
  const sorted = [...keywords].sort((a, b) => {
    const scoreA = a.opportunity_score || 0;
    const scoreB = b.opportunity_score || 0;
    return scoreB - scoreA;
  });

  // Assign priority 0-100
  return sorted.map((kw, index) => ({
    id: kw.id,
    priority: Math.max(0, 100 - index * 5)
  }));
}

export function estimateContentValue(metrics: ContentMetrics): number {
  // Estimate the value/impact of a content piece
  // Based on sessions, conversions, and AEO citations

  let value = 0;

  // Sessions (base value)
  value += (metrics.organic_sessions_30d || 0) * 1;

  // Position bonus (content ranking well = higher value)
  const position = metrics.avg_position || 50;
  const positionBonus = Math.max(0, (50 - position) / 5);
  value += positionBonus;

  // AEO bonus (cited in AI = higher value)
  value += (metrics.aeo_citation_count || 0) * 10;

  return Math.round(value);
}

export function calculateDifficulty(
  volume?: number,
  topCompetitorMetrics?: Array<{ aeo_citations: number; avg_position: number }>
): number {
  let difficulty = 30; // Base difficulty

  // Volume impacts difficulty
  if (volume) {
    if (volume > 5000) difficulty += 30;
    else if (volume > 1000) difficulty += 15;
    else if (volume > 100) difficulty += 5;
  }

  // Competitor strength impacts difficulty
  if (topCompetitorMetrics && topCompetitorMetrics.length > 0) {
    const avgAEOCitations =
      topCompetitorMetrics.reduce((sum, c) => sum + c.aeo_citations, 0) /
      topCompetitorMetrics.length;
    const avgPosition =
      topCompetitorMetrics.reduce((sum, c) => sum + c.avg_position, 0) /
      topCompetitorMetrics.length;

    if (avgAEOCitations > 5) difficulty += 15;
    if (avgPosition < 10) difficulty += 10;
  }

  return Math.min(difficulty, 100);
}

export function getContentRefreshPriority(
  healthScore: number,
  daysOld: number,
  sessions: number
): 'high' | 'medium' | 'low' {
  // High priority: good traffic, bad health, old
  if (healthScore < 40 && sessions > 100 && daysOld > 60) return 'high';

  // High priority: health < 30 regardless of other factors
  if (healthScore < 30) return 'high';

  // Medium priority: declining but still getting traffic
  if (healthScore < 50 && sessions > 50) return 'medium';

  // Low priority: older content, could be refreshed
  if (daysOld > 90) return 'low';

  return 'low';
}
