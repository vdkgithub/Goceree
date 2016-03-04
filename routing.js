
var routing = Backbone.Router.extend({
  routes : {
    '': 'index',
    'index': 'index',
    'Item': 'ItemFunc',
    'SomePage': 'SomePage'
  },
  index: function(){
      vcl.Load('mainbody', 'Home/Index.html');
  },
  SomePage: function() {
      vcl.Load('mainbody', 'Home/SomePage.html');
  }
});
