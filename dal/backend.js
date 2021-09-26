/**
 * This Module is used as an abstraction, incase we need
 * to switch the backend at a later stage we can do it 
 * at this single point rather than at all the usages
 * @module Backend
 */
export * from "./redisbackend";