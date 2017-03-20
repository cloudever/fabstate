# FABSTATE
Менеджер состояния форм для FAB

## Использование

```js
var state = createState({
    state: {
        enabled: false,
        computed: function() {
            return this.state.enabled.toString()
        }
    },
    dispatcher: function(state) {
        return {
            toggle: function() {
                state.enabled = !state.enabled
            }
        }
    },
    connect: {
        input: function(params) {
            return {
                type: params.inputType
            }
        }
    }
}).name('state')

var loader = createLoader(form);
loader.use(state);
```
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
TODO
