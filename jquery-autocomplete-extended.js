$.widget('riddlemd.autocompleteExtended', $.ui.autocomplete, {
      originalElement : null,
      options : {
          requireValidInput : true
      },
      _create : function() {
          var $currentWidget = this;

          this.originalElement = this.element;

          // Processed data attributes assigned to element with specified prefix into options of this widget.
          var prefix = 'autocomplete';
          var options = [];
          $.each(this.element.data(), function(key, value) {
            if(key.substring(0, prefix.length) == prefix) {
                var normalziedKey = key.substring(prefix.length).replace(/^([A-Z])/, function(text) { return text.toLowerCase(); });
                options[normalziedKey] = value;
            }
          });
          $.extend(this.options, options));

          // Check source and call back options to see if they are functions, if not see if they have functions in global space.
          var optionsToCheckForFunctions = [
              'source',
              'change',
              'close',
              'create',
              'focus',
              'open',
              'search',
              'select'
          ];

          $.each(optionsToCheckForFunctions, function(key, optionName) {
              if(typeof $currentWidget.options[optionName] != 'function' && typeof window[$currentWidget.options[optionName]] == 'function') {
                  $currentWidget.options[optionName] = window[$currentWidget.options[optionName]];
              }
          });

          if($currentWidget.options.source) {
              // If options.source is not a function still, assign it function that does customized ajax call.
              if(typeof $currentWidget.options.source != 'function') {
                  var sourceUrl = $currentWidget.options.source
                  $currentWidget.options.source = function(request, response) {
                      $.ajax({
                          url : sourceUrl + this.element.val(),
                          success : function(ajaxResponse) {
                              var items = [];
                              $.each(ajaxResponse, function(key, value) {
                                  items.push({
                                      label : value.label
                                      value : value.value
                                  });
                              });
                              response(items);
                          }
                      });
                  }
              }

              if(this.options.mask != undefined) {
                  this._initializeMaskElement();
              } else {
                  this._super();
              }
          } else {
              throw "Source option is REQUIRED";
          }
      },
      _setValue : function(value, mask) {
          if(this.element.hasClass('ui-autocomplete-mask')) {
              this.element
                  .addClass('is-valid')
                  .val(mask);
              this.originalElement
                    .val(value)
                    .change();
            } else {
                this.element
                    .addClass('is-valid')
                    .val(val)
                    .change();
            }
            
            if(sessionStorage != undefined) {
                sessionStorage['#' + this.element.attr('id') + '.value'] = mask;
            }
        },
        _initializeMaskElement : function() {
            var $currentWidget = this;
            $currentWidget.originalElement = this.element;
            var maskText = (this.options.mask ? this.options.mask : (this.element.val().length ? sessionStorage['#' + this.element.attr('id') + '-autocomplete-mask.value'] : ''));
            
            // Clear option mask or we'll get recursive when we apply autocomplete to the mask element.
            this.options.mask = null;
            
            // HiJack the select callback
            var originalSelectCallback = this.options.select;
            this.options.select = function(event, ui) {                
                $currentWidget.originalElement
                    .val(ui.item.value);
                    
                $currentWidget.element
                    .val(ui.item.label)
                    .addClass('is-valid')
                    .change();
                
                if(typeof originalSelectCallback == 'function') {
                    originalSelectCallback(event,ui);
                }
                return false;
            };
            
            // HiJack the response callback
            var originalResponseCallback = this.options.response;
            this.options.response = function(event, ui) {
                if($currentWidget.options.requireValidInput) {
                    if(ui.content.length == 1) {
                        $currentWidget._setValue(ui.content[0].value, ui.content[0].label);
                    }
                }
                
                if(typeof originalResponseCallback == 'function') {
                    originalResponseCallback(event,ui);
                }
            };
            
            // HiJack the focus callback
            var originalFocusCallback = this.options.focus;
            this.options.focus = function(event, ui) {
                $currentWidget._setValue(ui.item.value, ui.item.label);
                
                if(typeof originalFocusCallback == 'function') {
                    originalFocusCallback(event,ui);
                }
                
                return false;
            };
            
            this.element = this.originalElement.clone()
                .attr({
                    id : this.element.attr('id') + '-autocomplete-mask',
                    name : null,
                    type : 'text',
                    maxlength : null,
                    'data-autocomplete-mask' : null,
                    'data-autocomplete-change' : null,
                    'data-autocomplete-close' : null,
                    'data-autocomplete-create' : null,
                    'data-autocomplete-focus' : null,
                    'data-autocomplete-open' : null,
                    'data-autocomplete-response' : null,
                    'data-autocomplete-search' : null,
                    'data-autocomplete-select' : null,
                    'value' : null
                })
                .addClass('ui-autocomplete-mask')
                .val(maskText)
                .insertAfter(this.originalElement)
                .focus(function(e) {
                    $(this).removeClass('is-valid');
                })
                .change(function(e) {
                    if($currentWidget.options.requireValidInput && !$(this).hasClass('is-valid')) {
                        $(this).val('');
                        $currentWidget.originalElement
                                .val('');
                    }
                })
                .autocomplete(this.options);
                
            this.originalElement
                .hide();
        }
    });
