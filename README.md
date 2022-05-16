# omegga-currency

A lightweight currency plugin for Omegga.

**This is more of a dependency plugin than a feature plugin.**
Other Omegga plugins can hook into this one and use it for its interop events.
Omegga plugins that start with `omegga-currency-` are likely extension plugins and can interact
directly with this one. Careful with which plugins you add, as they can harmfully impact your
server's currency storage.

## Install

`omegga install gh:voximity/currency`

Install some extension plugins!

## Usage

Configure the config options from the web panel and enjoy.

## Making extensions

This plugin makes use of Omegga's plugin interop system. The following events are available for you to use:

| Event               | Args                                   | Description                                                                                                                                                                                    |
| ------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get`               | [`player id: string`]                  | Gets the player's entire currency data object.                                                                                                                                                 |
| `currency`          | [`player id: string`]                  | Gets the player's currency, formatted as a string, with the server's chosen prefix. **This is the preferred method of getting string formatted currency.**                                     |
| `get.path.to.data`  | [`player id: string`]                  | Gets some data from the player's data object, given as a path. **This is the preferred method of getting the player's currency as a number.** Use `get.currency` to get the player's currency. |
| `update`            | [`player id: string`, `data: object`]  | Updates the player's data object by merging it with the one given.                                                                                                                             |
| `set.path.to.data`  | [`player id: string`, `data: any`]     | Sets a field in the player's data to the data given. If the path contains intermediate unset objects, they will be created as the data is traversed.                                           |
| `add.path.to.data`  | [`player id: string`, `value: number`] | Assuming `path.to.data` represents a numeric field, adds `value` to it. If it is unset, it is set to `value`.                                                                                  |
| `push.path.to.data` | [`player id: string`, `value: any`]    | Assuming `path.to.data` represents an array, pushes `value` onto the array. If the array is unset, it is set to `[value]`.                                                                     |
| `delete.path.to.data` | [`player id: string`] | Deletes the field found at `path.to.data`, assuming it is not a field provided by this plugin, like `currency`. |

### Errors

If one of the events error, it will return an object of type `{ error: string }`.

### Event object paths

In the above, `path.to.data` represents a [jq](https://stedolan.github.io/jq/)-like path syntax that allows you to traverse down the player's data object. For example, assume the player's data object looks like this:

```json
{
    "currency": 0,
    "foo": {
        "bar": 10
    }
}
```

If we use `add.foo.bar` with a value of `5`, the data object becomes:

```json
{
    "currency": 0,
    "foo": {
        "bar": 15
    }
}
```

Or, we can use something like `push.foo.baz` with a value of `"hello"`. The data object then becomes:

```json
{
    "currency": 0,
    "foo": {
        "bar": 15,
        "baz": ["hello"]
    }
}
```
