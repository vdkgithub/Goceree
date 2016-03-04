
$(function(){
  var global = function(){
      var _ = this;

      this.router = [];

      this.application_start = function(){
        _.RegisterGlobalConfig();
        _.router = new routing();
        Backbone.history.start({root: "/index.html"});
      }

      this.RegisterGlobalConfig = function(){
          vcl.GetFile({
            file: 'Config.json',
            success: function(dataml){
              window.Config = JSON.parse(dataml);
              document.querySelector('title').innerHTML = Config.Title + ' - ' + Config.Version;
            }
          });
      }

      var __Construct = function(){
          _.application_start();
      }()
  }();
});
