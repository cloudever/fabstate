# FABSTATE
Менеджер состояния форм для AngularJS

## Использование
Представим, что мы используем в качестве `$scope` переменную `form`, тогда получим следующий код.

```js
var state = createState({  
    
    // Состояние - просто объект
    state: {
        enabled: false,
        
        // После ассигнации выражения функции будут доступны в виде getter'ов
        computed: function() {
            // В computed выражениях this - это универсальный внутренний объект
            // Содержит в себе state и form = $scope
            return this.state.enabled.toString()
        },
        
        // ..поэтому вы можете использовать декораторы, которые возвращают другие функции (см. decorators.js)
        expression: decorators.expression('state.enabled')
        
        // И вы можете использовать даже substate-ы
        expression: decoratoes.substate({
            state: {
                enabled: false
            },
            dispatcher: function(state) {
                return {
                    toggle: function() {
                        state.enabled = !state.enabled
                    }
                }
            }
        })
    },
    
    // Диспетчер принимает в себя state и возвращает объект с actions
    // Это сделано для того, чтобы иметь возможность инициализировать какие-нибудь данные перед вычисление диспетчера.
    dispatcher: function(state, context) {
        return {
            toggle: function() {
                state.enabled = !state.enabled
            }
        }
    },
    
    // Deprecated
    connect: {
        input: function(params) {
            return {
                type: params.inputType
            }
        }
    },
    
    // Микшины - это функции, котороые возвращают мини-диспетчеры, которые буду вызваны перед главным диспетчером
    mixins: []
}).name('state') // Имя состояния / в view будет доступно как $scope.[name] 

// Loader инициализирует state и добавляет его в $scope
var loader = createLoader($scope);

// Вы можете использовать столько state'оы сколько пожелаете нужным, главное - не повторять имен.
// Обмениваются данными state'ы через context
loader.use(state);
```

И на примере использования компонентного подхода, у нас есть такой код.
```html
<fab-form
    caption="Caption">
    <fab-row>
        <fab-col>
            <fab-edit
                caption="Field"
                enabled="{{state.enabled}}"
                value="state.type">
            </fab-edit>
        </fab-col>
        <fab-col>
            <fab-button
                caption="Toggle"
                on-click="state.dispatch('toggle')">
            </fab-button>
        </fab-col>
    </fab-row>
</fab-form>
```

## API
