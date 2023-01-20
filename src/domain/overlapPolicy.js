"use strict";

/**
 * Overlap policies decide how many minutes of overlap a pair of shifts is
 * allowed before it counts as a scheduling conflict.
 *
 * This is the seam a future change lands on: a customer that runs a 15 minute
 * handover, or that tolerates overlap between two wards of the same hospital
 * group, registers a policy here instead of editing the service.
 */

/**
 * @typedef {object} OverlapPolicy
 * @property {string} name
 * @property {(shiftA: object, shiftB: object) => number} allowanceMinutes
 */

/** @type {Map<string, (options: object) => OverlapPolicy>} */
const registry = new Map();

/**
 * Register a named policy factory.
 *
 * @param {string} name
 * @param {(options: object) => OverlapPolicy} factory
 */
function registerOverlapPolicy(name, factory) {
  if (typeof factory !== "function") {
    throw new TypeError(`Overlap policy "${name}" must be registered with a factory function`);
  }
  registry.set(name, factory);
}

/**
 * Build a policy by name.
 *
 * @param {string} name
 * @param {object} [options]
 * @returns {OverlapPolicy}
 */
function createOverlapPolicy(name, options = {}) {
  const factory = registry.get(name);
  if (!factory) {
    const known = [...registry.keys()].join(", ") || "none";
    throw new Error(`Unknown overlap policy "${name}". Registered policies: ${known}`);
  }
  return factory(options);
}

/** Names of every registered policy, for diagnostics and tests. */
function listOverlapPolicies() {
  return [...registry.keys()];
}

/**
 * The default policy, and the one the original brief describes.
 *
 * Two shifts at the same facility may overlap by a handover window, because the
 * outgoing and incoming nurse hand the ward over in person. Two shifts at
 * different facilities may not overlap at all, because nobody can be in two
 * buildings simultaneously.
 */
registerOverlapPolicy("handover", (options) => {
  const sameFacility = Number(options.sameFacilityAllowanceMinutes ?? 30);
  const crossFacility = Number(options.crossFacilityAllowanceMinutes ?? 0);
  return {
    name: "handover",
    allowanceMinutes(shiftA, shiftB) {
      const sameSite =
        shiftA.facility_id !== null &&
        shiftA.facility_id !== undefined &&
        shiftA.facility_id === shiftB.facility_id;
      return sameSite ? sameFacility : crossFacility;
    },
  };
});

/** A policy for sites that never permit overlap, whatever the facility. */
registerOverlapPolicy("strict", () => ({
  name: "strict",
  allowanceMinutes: () => 0,
}));

module.exports = {
  registerOverlapPolicy,
  createOverlapPolicy,
  listOverlapPolicies,
};
