describe("Model", function () {

  var doc, text, section, resource;

  beforeEach(function () {
    window.graph = new Data.Graph(seed);
    
    // Build example document:
    // * doc
    //   * text
    //   * section
    //     * resource
    
    
    doc = graph.set(null, _.extend(graph.get('/type/article').meta.template, {
      name: 'testing-doc',
      title: "Testing Doc"
    }));
    
    text = graph.set(null, {
      type: '/type/text',
      content: "Lorem ipsum dolor sit amet",
      document: doc._id
    });
    doc.all('children').set(text._id, text, 0);
    
    section = graph.set(null, {
      type: '/type/section',
      name: "First section",
      document: doc._id
    });
    doc.all('children').set(section._id, section, 1);
    
    resource = graph.set(null, {
      type: '/type/resource',
      caption: "This is the caption. Very interesting.",
      url: 'substance.jpg.to',
      document: doc._id
    });
    section.all('children').set(resource._id, resource, 0);
    
    doc._dirty = text._dirty = section._dirty = resource._dirty = false;
  });

  afterEach(function () {
    delete window.graph;
  });

  describe("Position", function () {
    it("should save the parent and the previous sibling", function () {
      var p = new Position(doc, text);
      expect(p.parent).toBe(doc);
      expect(p.after).toBe(text);
    });
    
    it("should describe itself", function () {
      var p = new Position(section, null);
      expect(p.toString()).toMatch(/^new Position\(/);
    })
  });

  describe("getDocument", function () {
    it("should return the document of the node", function () {
      expect(getDocument(doc)).toBe(doc);
      expect(getDocument(section)).toBe(doc);
      expect(getDocument(resource)).toBe(doc);
    });
  });

  describe("isSection", function () {
    it("should tell if the node is a section", function () {
      expect(isSection(doc)).toBe(false);
      expect(isSection(text)).toBe(false);
      expect(isSection(section)).toBe(true);
      expect(isSection(resource)).toBe(false);
    });
  });

  describe("isLastChild", function () {
    it("should tell me if a given node is the last child of its parent", function () {
      expect(isLastChild(doc, text)).toBe(false);
      expect(isLastChild(doc, section)).toBe(true);
      expect(isLastChild(section, resource)).toBe(true);
    });
  });

  describe("removeChild", function () {
    it("should remove the child forever per default", function () {
      var removedSpy = bindSpy(text, 'removed');
      expect(doc.all('children').index(text._id)).toBe(0);
      expect(text._deleted).toBeFalsy();
      expect(doc._dirty).toBe(false);
      removeChild(doc, text);
      expect(doc.all('children').index(text._id)).toBe(-1);
      expect(text._deleted).toBe(true);
      expect(doc._dirty).toBe(true);
      expect(removedSpy).toHaveBeenCalled();
    });

    /*
     * TODO
    it("should remove children recursively", function () {
      removeChild(doc, section);
      expect(resource._deleted).toBe(true);
    });
    */

    it("should remove the child only temporarily if the third parameter is true", function () {
      expect(section.all('children').index(resource._id)).toBe(0);
      expect(resource._deleted).toBeFalsy();
      removeChild(section, resource, true);
      expect(section.all('children').index(resource._id)).toBe(-1);
      expect(resource._deleted).toBeFalsy();
    });

    it("should trigger the event 'last-child-changed' on the parent if the removed child was the last child", function () {
      var lastChildChangedSpy = bindSpy(doc, 'last-child-changed');
      removeChild(doc, text);
      expect(lastChildChangedSpy).not.toHaveBeenCalled();
      removeChild(doc, section);
      expect(lastChildChangedSpy).toHaveBeenCalled();
    });
  });

  describe("removeChildTemporary", function () {
    it("should do the same thing as removeChild with the third parameter set to true", function () {
      // hence I copied the test case
      expect(section.all('children').index(resource._id)).toBe(0);
      expect(resource._deleted).toBeFalsy();
      removeChild(section, resource, true);
      expect(section.all('children').index(resource._id)).toBe(-1);
      expect(resource._deleted).toBeFalsy();
    })
  });

  describe("addChild", function () {
    var quote;
    
    beforeEach(function () {
      quote = graph.set(null, {
        type: '/type/quote',
        content: "Yes, we can!",
        author: "Barack Obama",
        document: doc._id
      });
    });
    
    it("should insert at the beginning", function () {
      var p = new Position(doc, null);
      var addedChildSpy = bindSpy(doc, 'added-child');
      var lastChildChangedSpy = bindSpy(doc, 'last-child-changed');
      expect(doc.all('children').at(0)).toBe(text);
      expect(doc._dirty).toBe(false);
      addChild(quote, p);
      expect(doc.all('children').at(0)).toBe(quote);
      expect(doc._dirty).toBe(true);
      expect(addedChildSpy).toHaveBeenCalledWith(quote, 0);
      expect(lastChildChangedSpy).not.toHaveBeenCalled();
    });
    
    it("should insert in the middle", function () {
      var p = new Position(doc, text);
      var addedChildSpy = bindSpy(doc, 'added-child');
      var lastChildChangedSpy = bindSpy(doc, 'last-child-changed');
      expect(doc.all('children').at(1)).toBe(section);
      expect(doc._dirty).toBe(false);
      addChild(quote, p);
      expect(doc.all('children').at(1)).toBe(quote);
      expect(doc._dirty).toBe(true);
      expect(addedChildSpy).toHaveBeenCalled();
      expect(lastChildChangedSpy).not.toHaveBeenCalledWith(quote, 1);
    });

    it("should insert at the end", function () {
      var p = new Position(section, resource);
      var addedChildSpy = bindSpy(section, 'added-child');
      var lastChildChangedSpy = bindSpy(section, 'last-child-changed');
      expect(section.all('children').length).toBe(1);
      expect(section._dirty).toBe(false);
      addChild(quote, p);
      expect(section.all('children').length).toBe(2);
      expect(section._dirty).toBe(true);
      expect(addedChildSpy).toHaveBeenCalledWith(quote, 1);
      expect(lastChildChangedSpy).toHaveBeenCalled();
    });

    it("should move all following non-section siblings into the new section", function () {
      addChild(quote, new Position(doc, text));
      
      var p = new Position(doc, text)
      ,   newSection = graph.set(null, {
        type: '/type/section',
        name: "Another section",
        document: doc._id
      });
      var lastChildChangedSpy = bindSpy(newSection, 'last-child-changed');
      expect(doc.all('children').length).toBe(3);
      expect(newSection.all('children').length).toBe(0);
      addChild(newSection, p);
      expect(doc.all('children').length).toBe(3);
      expect(newSection.all('children').length).toBe(1);
      expect(newSection.all('children').at(0)).toBe(quote);
      expect(lastChildChangedSpy).toHaveBeenCalled();
    });

    it("should move all following non-section siblings into the last nested section", function () {
      var newSection = graph.set(null, {
        type: '/type/section',
        name: "Nested Section",
        document: doc._id
      });
      var nestedSection = graph.set(null, {
        type: '/type/section',
        name: "Nested Section",
        document: doc._id
      });
      newSection.all('children').set(nestedSection._id, nestedSection);
      
      var p = new Position(section, null);
      addChild(newSection, p);
      
      expect(section.all('children').length).toBe(1);
      expect(section.all('children').at(0)).toBe(newSection);
      expect(newSection.all('children').length).toBe(1);
      expect(newSection.all('children').at(0)).toBe(nestedSection);
      expect(nestedSection.all('children').length).toBe(1);
      expect(nestedSection.all('children').at(0)).toBe(resource);
    });
  });

  describe("moveChild", function () {
    it("should move a node from its old parent to a new position", function () {
      var removedSpy = bindSpy(text, 'removed')
      ,   addedChildSpy = bindSpy(section, 'added-child');
      
      var p = new Position(section, null);
      
      expect(doc.all('children').length).toBe(2);
      expect(section.all('children').length).toBe(1);
      moveChild(doc, text, p);
      expect(text._removed).toBeFalsy();
      expect(doc.all('children').length).toBe(1);
      expect(section.all('children').length).toBe(2);
      
      expect(removedSpy).toHaveBeenCalled();
      expect(addedChildSpy).toHaveBeenCalledWith(text, 0);
    })
  });

  describe("createNode", function () {
    it("should create a new node of the given type at the given position", function () {
      var p = new Position(doc, null);
      var addedChildSpy = bindSpy(doc, 'added-child');
      
      expect(doc.all('children').length).toBe(2);
      var code = createNode('/type/code', p);
      expect(code.get('document')).toBe(doc);
      expect(doc.all('children').length).toBe(3);
      expect(doc.all('children').at(0)).toBe(code);
      expect(addedChildSpy).toHaveBeenCalledWith(code, 0);
    })
  });

  describe("getFollowingSiblings", function () {
    it("should return a hash of all siblings after a given position", function () {
      var siblings = getFollowingSiblings(new Position(doc, text));
      expect(siblings instanceof Data.Hash).toBe(true);
      expect(siblings.length).toBe(1);
      expect(siblings.at(0)).toBe(section);
    });

    it("should return a copy of the children if the position is the beginning", function () {
      var siblings = getFollowingSiblings(new Position(doc, null));
      expect(siblings.length).toBe(2);
      expect(siblings).not.toBe(doc.all('children'));
    })
  });

  describe("addFollowingSiblings", function () {
    it("should all following non-section siblings into a given node", function () {
      var code = graph.set(null, {
        type: '/type/code',
        content: "for (var i = 0; i < l; i++) { foo(i); }",
        document: doc._id
      });
      addChild(code, new Position(doc, text));
      
      var lastChildChangedSpy = bindSpy(section, 'last-child-changed');
      expect(section.all('children').length).toBe(1);
      expect(doc.all('children').length).toBe(3);
      addFollowingSiblings(new Position(doc, null), section);
      expect(section.all('children').length).toBe(3);
      expect(doc.all('children').length).toBe(1);
      expect(section.all('children').at(1)).toBe(text);
      expect(section.all('children').at(2)).toBe(code);
      expect(lastChildChangedSpy).toHaveBeenCalled();
    });
  });

  describe("updateNode", function () {
    it("should update the node and set the updated_at time of the document", function () {
        // According to Wikipedia:
      var newLead = "A lead paragraph in literature refers to the opening paragraph of an article, essay, news story or book chapter.";
      
      var oldUpdatedAt = doc.get('updated_at');
      updateNode(doc, {
        lead: newLead
      });
      expect(doc.get('lead')).toBe(newLead);
      expect(doc.get('updated_at')).not.toBe(oldUpdatedAt);
    });
  });

  describe("possibleChildTypes", function () {
    it("should return all allowed children types and their positions", function () {
      var doc = graph.set(null, _.extend(graph.get('/type/qaa').meta.template, {
        title: "Question and Answer",
        name: 'question-and-answer'
      }));
      var result = possibleChildTypes(new Position(doc, null));
      expect(result.length).toBe(2);
      expect(result.get('/type/question')).toBeTruthy();
      expect(result.get('/type/answer')).toBeTruthy();
      result.each(function (arr) {
        expect(arr.length).toBe(1);
        expect(arr[0].parent).toBe(doc);
        expect(arr[0].after).toBe(null);
      });
    });

    it("should have the right order", function () {
      var result = possibleChildTypes(new Position(doc, null));
      
      function testBefore(a, b) {
        expect(result.index(a)).toBeLessThan(result.index(b));
      }
      testBefore('/type/section', '/type/text');
      testBefore('/type/text', '/type/image');
      testBefore('/type/image', '/type/resource');
      testBefore('/type/resource', '/type/quote');
      testBefore('/type/quote', '/type/code');
    });

    it("should return all possible positions", function () {
      var result = possibleChildTypes(new Position(doc, section));
      
      result.each(function (positions, type) {
        expect(positions.length).toBe(2);
        expect(positions[0].parent).toBe(doc);
        expect(positions[0].after).toBe(section);
        expect(positions[1].parent).toBe(section);
        expect(positions[1].after).toBe(resource);
      });
    });
  });

  describe("getTypeName", function () {
    it("should return a nice name for the given type", function () {
      expect(getTypeName('/type/section')).toBe("Section");
      expect(getTypeName('/type/text')).toBe("Text");
      expect(getTypeName('/type/qaa')).toBe("Q&A");
    });
  });

  describe("moveTargetPositions", function () {
    it("should return target possible positions for a given node", function () {
      var nestedSection = graph.set(null, {
        type: '/type/section',
        name: "Subsection"
      });
      addChild(nestedSection, new Position(section, resource));
      var result = moveTargetPositions(text, new Position(doc, section));
      expect(result.length).toBe(3);
      expect(result[0].parent).toBe(doc);
      expect(result[0].after).toBe(section);
      expect(result[1].parent).toBe(section);
      expect(result[1].after).toBe(nestedSection);
      expect(result[2].parent).toBe(nestedSection);
      expect(result[2].after).toBe(null);
    });

    it("should return an empty array if the node can't be moved to the given position", function () {
      var doc = graph.set(null, _.extend(graph.get('/type/qaa').meta.template, {
        title: "Question and Answer",
        name: 'question-and-answer'
      }));
      var result = moveTargetPositions(text, new Position(doc, null));
      expect(result.length).toBe(0);
    });
  });

  // TODO: test comments
});
