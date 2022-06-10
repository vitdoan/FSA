// getProp(obj: Object, name: string): any
// returns the value of the given property, or undefined
function getProp(obj, name) {
  let prop = lib220.getProperty(obj, name);
  return prop.found ? prop.value : undefined;
}

const setProp = (obj,e,val) => {lib220.setProperty(obj,e,val);};


class FSA{
  constructor(){
    let state = undefined;
    let statesObj = {};

    this.nextState = e => {
      if(state !== undefined){
      state = state.nextState(e);
      }
      return this;
    }

    this.createState = (s,transitions) => {
      let curS = getProp(statesObj,s);
      if(curS === undefined){
        let newState = new State(s);
        if(Object.keys(statesObj).length === 0){
          state = newState;
        }
        setProp(statesObj, s, newState);
      }
      else {
        curS.resetTransition();
      }
      transitions.forEach(x=>{this.addTransition(s, x)});
      return this;
    }

    this.addTransition = (s,t) => {
      let curS = getProp(statesObj, s);
      if(curS === undefined){
        this.createState(s, []);
        curS = getProp(statesObj, s);
      }
      if(Object.keys(t).length === 0){ return this;}
      let event = Object.keys(t)[0];
      let value = Object.values(t)[0];
      let curT = getProp(statesObj, value);
      if(curT === undefined){
        this.createState(value, []);
        curS.addTransition(event,getProp(statesObj, value));
      }
      else{
        curS.addTransition(event,curT);
      }
      return this;
    }

    this.showState = () => (state === undefined)? undefined : state.getName();
    
    this.renameState = (oldName, newName) => { 
      let curS = getProp(statesObj, oldName);
      if(curS !== undefined){ curS.setName(newName);}
      return this;
    }

    this.createMemento = () => {
      let meme = new Memento();
      if(state !== undefined){
        meme.storeState(state.getName());
      }
      else{
        meme.storeState(undefined);
      }
      return meme;
    }

    this.restoreMemento = (m) => {
      if(m.getState() !== undefined){
        let memeS = getProp(statesObj,m.getState());
        if(memeS !== undefined){
          state = memeS;
        }
      }
      return this;
    }

    class State{
      constructor(s){
        let stateName = s;
        let statesArr = [];
        this.getName = () => stateName;
        this.setName = s => {stateName = s; return this;}
        this.resetTransition = () => {statesArr = [];}

        this.addTransition = (e,s) => {
          let tObj = {};
          setProp(tObj,e,s);
          statesArr.push(tObj);
          return this;
        }

        this.nextState = e => {
          let nextS = this.nextStates(e);
          if(nextS.length === 0) { return undefined;}
          return nextS[Math.floor(Math.random()*nextS.length)];
        }

        this.nextStates = e => {
          let arr = [];
          statesArr.forEach(x => {
            let ts = getProp(x,e);
            if(ts !== undefined){
              arr.push(ts);
            }
          });
          return arr;
        }
      }
    }

    class Memento{
      constructor(){
        let state = undefined;
        this.storeState = s => { state = s;}
        this.getState = () => state;
      }
    }
  }
}

///////////////////TEST CASES/////////////////////////
let myMachine = new FSA();
myMachine.createState("delicates, low", [{mode: "normal, low"}, {temp: "delicates, medium"}]); 
myMachine.createState("normal, low", [{mode: "delicates, low"}, {temp: "normal, medium"}]); 
myMachine.createState("delicates, medium", [{mode: "normal, medium"},{temp: "delicates, low"}]); 
myMachine.createState("normal, medium", [{mode: "delicates, medium"},{temp: "normal, high"}]); 
myMachine.createState("normal, high", [{mode: "delicates, medium"},{temp: "normal, low"}]);

test("Washing machine cases return correctly", function() {
  assert(myMachine.showState() === "delicates, low");
  myMachine.nextState("mode");
  assert(myMachine.showState() === "normal, low");
  myMachine.nextState("mode");
  assert(myMachine.showState() === "delicates, low");
  myMachine.nextState("temp");
  assert(myMachine.showState() === "delicates, medium");
  myMachine.nextState("mode");
  assert(myMachine.showState() === "normal, medium");
  myMachine.nextState("temp");
  assert(myMachine.showState() === "normal, high");
});
//currentState is normal,high
test("Washing machine cases return correctly", function() {
  let restoreTo = myMachine.createMemento();
  assert(myMachine.showState() === "normal, high");
  myMachine.nextState("mode");
  assert(myMachine.showState() === "delicates, medium");
  myMachine.nextState("temp");
  assert(myMachine.showState() === "delicates, low");
  myMachine.restoreMemento(restoreTo);
  assert(myMachine.showState() === "normal, high");
});


test("Works fine for same event", function() {
  let st = new FSA();
  st.createState("s1",[{mode: "s2"},{mode: "s3"}]);
  st.createState("s4",[{mode: "s1"},{mode: "s2"},{mode: "s2"}]);
  assert(st.showState() === "s1");
  st.nextState("mode");
  assert(st.showState() === "s2" || st.showState() === "s3");
  //If no moves exists, return undefined
  st.nextState("temp");
  assert(st.showState() === undefined);
});

test("nextState does nothing if curretn state is undefined", function() {
  let st = new FSA();
  st.nextState("mode");
  assert(st.showState() === undefined);
});

test("Replace duplicate nmaes in createState", function() {
  let st = new FSA()
  st.createState("s1",[{mode: "s2"}]);
  st.createState("s2",[{mode: "s1"}]);
  st.createState("s1",[{mode: "s3"}]);
  st.createState("s3",[{mode: "s2"}]);
  assert(st.showState() === "s1");
  st.nextState("mode");
  assert(st.showState() === "s3");
  st.nextState("mode");
  st.nextState("mode");
  assert(st.showState() === "s1");
});

test("Adding a transition creates target states if they do not already exist", function() {
  let st = new FSA()
  st.createState("s1",[{mode: "s2"}]);
  st.createState("s2",[{mode: "s3"}]);
  st.createState("s3",[{mode: "s4"}]);
  st.addTransition("s4",{mode: "s1"});
  assert(st.showState() === "s1");
  st.nextState("mode");
  st.nextState("mode");
  st.nextState("mode");
  assert(st.showState() === "s4");
  st.nextState("mode");
  st.nextState("mode");
  assert(st.showState() === "s2");
  st.createState("s2",[{mode: "s6"}]);
  st.nextState("mode");
  assert(st.showState() === "s6");
  st.addTransition("s6",{mode: "s7"});
  st.nextState("mode");
  assert(st.showState() === "s7");
});

test("howState() returns undefined", function() {
  let st = new FSA()
  assert(st.showState() === undefined);
});

test("renameState() works correctly", function() {
  let st = new FSA();
  assert(st.showState() === undefined);
  st.createState("1",[{a: "2"}]);
  st.createState("2",[{b: "1"}]);
  st.renameState("4","1");
  st.renameState("2","3");
  assert(st.showState() === "1");
  st.nextState("a");
  assert(st.showState() === "3");
});

test("createMemento() returns undefined if current state is undefined", function() {
  let st = new FSA();
  let m = st.createMemento();
  assert(m.getState() === undefined);
  st.createState("1",[{a: "2"}]);
  st.restoreMemento(m);
  assert(st.showState() === "1");
});

test("createMemento() creates a memento object with the name of the current state", function() {
  let st = new FSA();
  st.createState("1",[{a: "2"}]);
  st.createState("2",[{a: "3"}]);
  st.createState("3",[{a: "4"}]);
  st.createState("4",[{a: "5"}]);
  st.createState("5",[{a: "1"}]);
  st.nextState("a");
  let m = st.createMemento();
  assert(m.getState() === "2");
  st.nextState("a");
  st.nextState("a");
  assert(st.showState() === "4");
  st.restoreMemento(m);
  assert(m.getState() === "2");
});

test("restoreMemento() does nothing if no such state exists", function() {
  let myMachine = new FSA();
  let m = myMachine.createMemento();
  myMachine.createState("delicates, low", [{mode: "normal, low"}, {temp: "delicates, medium"}]); 
  myMachine.createState("normal, low", [{mode: "delicates, low"}, {temp: "normal, medium"}]); 
  myMachine.restoreMemento(m);
  assert(myMachine.showState() === "delicates, low");
});

test("empty transition does not break", function() {
  let myMachine = new FSA();
  myMachine.createState("delicates, low", []);
  myMachine.createState("normal, low", [{mode: "delicates, low"}, {temp: "normal, medium"}]); 
  myMachine.nextState("some");
  assert(myMachine.showState() === undefined);
});

test("empty transition does not break", function() {
  let myMachine = new FSA();
  myMachine.createState("normal, low", [{mode: "delicates, low"}, {temp: "normal, medium"}]); 
  myMachine.nextState("some");
  assert(myMachine.showState() === undefined);
  myMachine.createState("high, low", [{mode: "medium, low"}, {temp: "normal, high"}]); 
  assert(myMachine.showState() === undefined);
});

test("Create self loop transition", function() {
  let myMachine = new FSA();
  myMachine.createState("normal, low", [{mode: "normal, low"}, {temp: "normal, medium"}]); 
  myMachine.nextState("mode");
  assert(myMachine.showState() === "normal, low");
  myMachine.nextState("temp");
  assert(myMachine.showState() === "normal, medium");
});

test("Recreate state", function() {
  let myMachine = new FSA();
  myMachine.createState("normal, low", [{mode: "delicates, low"}, {temp: "normal, medium"}]); 
  assert(myMachine.showState() === "normal, low");
  myMachine.createState("normal, low", [{mode: "high, low"}, {temp: "normal, medium"}]);
  myMachine.nextState("mode");
  assert(myMachine.showState() === "high, low");
});

