import { FastifyRequest, FastifyReply } from 'fastify';
import Joi from 'joi';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { error } = schema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.details[0].message,
          details: error.details,
        });
      }
    } catch (err) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid request body',
      });
    }
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { error } = schema.validate(request.query);
      if (error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.details[0].message,
          details: error.details,
        });
      }
    } catch (err) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid query parameters',
      });
    }
  };
};