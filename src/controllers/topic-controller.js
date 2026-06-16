function createTopicController(topicService, messageService, topicRepository) {
  return {
    async listTags(_request, response, next) {
      try {
        const tags = await topicRepository.listTags();
        response.json({ tags });
      } catch (error) {
        next(error);
      }
    },

    async list(request, response, next) {
      try {
        const result = await topicService.listTopics(request.query, request.auth);
        response.json(result);
      } catch (error) {
        next(error);
      }
    },

    async getOne(request, response, next) {
      try {
        const topic = await topicService.getTopic(request.params.id, request.auth);
        response.json({ topic });
      } catch (error) {
        next(error);
      }
    },

    async create(request, response, next) {
      try {
        const topic = await topicService.createTopic(request.auth.userId, request.body);
        response.status(201).json({ topic });
      } catch (error) {
        next(error);
      }
    },

    async update(request, response, next) {
      try {
        const topic = await topicService.updateTopic(request.params.id, request.auth, request.body);
        response.json({ topic });
      } catch (error) {
        next(error);
      }
    },

    async remove(request, response, next) {
      try {
        await topicService.deleteTopic(request.params.id, request.auth);
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    },

    // Messages nested under a topic.
    async listMessages(request, response, next) {
      try {
        const result = await messageService.listMessages(request.params.id, request.query, request.auth);
        response.json(result);
      } catch (error) {
        next(error);
      }
    },

    async postMessage(request, response, next) {
      try {
        const imageUrl = request.file ? `/uploads/${request.file.filename}` : null;
        const message = await messageService.postMessage(request.params.id, request.auth, {
          body: request.body.body,
          imageUrl
        });
        response.status(201).json({ message });
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createTopicController
};
