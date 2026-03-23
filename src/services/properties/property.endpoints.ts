/** URL paths for the Properties API. */
export class PropertyEndpoints {
  static readonly BASE = 'properties';
  static readonly BY_ID = 'properties/{id}';
  static readonly BY_WHATSAPP_PHONE = 'properties/whatsapp-phone/{phone_number_id}';
  static readonly BY_CODE = 'properties/code/{code}';
}
