describe("StateMachine", function () {
  var extend = Backbone.Model.extend;

  var Parent, Child;

  beforeEach(function () {
    Parent = function () {
      this.state = 'one';
    };
    _.extend(Parent.prototype, StateMachine);
    Parent.extend = extend;
    Parent.states = {
      one: {
        foo: jasmine.createSpy(),
        enter: jasmine.createSpy(),
        leave: jasmine.createSpy()
      },
      two: {
        foo: jasmine.createSpy(),
        enter: jasmine.createSpy(),
        leave: function (newState) {
          if (newState === 'one') { return false; }
        }
      }
    };
    
    Child = Parent.extend({}, {
      states: {
        one: {
          foo: jasmine.createSpy()
        },
        two: {
          bar: function () { return 42; }
        }
      }
    });
  });
  
  it("invokeForState", function () {
    var o = new Child();
    expect(o.state).toBe('one');
    o.invokeForState('foo', 1, 'lorem', 2);
    expect(Child.states.one.foo).toHaveBeenCalledWith(1, 'lorem', 2);
    expect(Parent.states.one.foo).not.toHaveBeenCalled();
    o.state = 'two';
    o.invokeForState('foo', 42);
    expect(Parent.states.two.foo).toHaveBeenCalledWith(42);
    expect(o.invokeForState('bar')).toBe(42);
  });

  it("transitionTo", function () {
    var o = new Child();
    spyOn(Parent.states.two, 'leave').andCallThrough();
    o.transitionTo('two');
    expect(Parent.states.one.leave).toHaveBeenCalledWith('two');
    expect(Parent.states.two.enter).toHaveBeenCalled();
    expect(o.state).toBe('two');
    o.transitionTo('one');
    expect(Parent.states.two.leave).toHaveBeenCalledWith('one');
    expect(Parent.states.one.enter).not.toHaveBeenCalled();
    expect(o.state).toBe('two');
  });
});
