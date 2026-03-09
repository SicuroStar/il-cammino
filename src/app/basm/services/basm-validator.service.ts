/**
 * BasmValidatorService — lightweight structural validation for BASMDocument.
 *
 * Checks required top-level properties and critical field types.
 * Returns a list of human-readable error strings.
 * An error starting with 'FATAL' means the document cannot be imported.
 *
 * Full JSON Schema validation (AJV) is deferred to CI/CD pipeline.
 */

import { Injectable } from '@angular/core';
import { BASMDocument } from '../types/basm.types';

const REQUIRED_KEYS: (keyof BASMDocument)[] = [
  'basm_metadata',
  'identity_context',
  'business_impact_analysis',
  'security_controls',
  'graph_edges',
];

@Injectable({ providedIn: 'root' })
export class BasmValidatorService {

  validate(doc: unknown): string[] {
    const errors: string[] = [];

    if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
      return ['FATAL: document is not a JSON object'];
    }

    const d = doc as Record<string, unknown>;

    for (const key of REQUIRED_KEYS) {
      if (!(key in d)) {
        errors.push(`FATAL: missing required field '${key}'`);
      }
    }

    // identity_context.app_id must be a non-empty string
    const ic = d.identity_context as Record<string, unknown> | undefined;
    if (!ic?.app_id || typeof ic.app_id !== 'string') {
      errors.push('FATAL: identity_context.app_id is missing or not a string');
    }

    // security_controls must be an array
    if (!Array.isArray(d.security_controls)) {
      errors.push('FATAL: security_controls must be an array');
    }

    // graph_edges must be an array
    if (!Array.isArray(d.graph_edges)) {
      errors.push('graph_edges is not an array — defaulting to []');
    }

    // basm_metadata.schema_version present
    const meta = d.basm_metadata as Record<string, unknown> | undefined;
    if (!meta?.schema_version) {
      errors.push('basm_metadata.schema_version is missing');
    }

    return errors;
  }
}
