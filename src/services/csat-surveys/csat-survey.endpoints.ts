/** URL paths for the CSAT Surveys API. */
export class CsatSurveyEndpoints {
  static readonly BASE = 'csat-surveys';
  static readonly PENDING = 'csat-surveys/pending';
  static readonly BY_ID = 'csat-surveys/{id}';
  static readonly ACTIVE_FOR_GUEST = 'csat-surveys/active-for-guest/{guest_id}';
}
