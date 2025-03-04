import * as vue from 'vue';
import { WatchStopHandle, WatchSource, WatchCallback, PropType, Ref, Directive } from 'vue';
import * as _vue_shared from '@vue/shared';

type PropertyEventType = 'dirty' | 'beforeChange' | 'change' | 'invalidValue' | 'focus' | 'blur' | 'addRow' | 'removeRow' | 'exchangeRow' | 'beforeWrap';
type IPropertyEventData = {
    type: PropertyEventType;
    target: IWrappedProperty;
    path?: string;
    value?: any;
    prevValue?: any;
    stopPropagate?: boolean;
    $obj?: IWrappedProperty;
};
type PropertyEventDelegate<ContextType = any> = (event: IPropertyEventData, ctx: ContextType) => void;

interface IValidateResult {
    validation: string;
    expected?: any;
    message?: string;
    stringValue?: string;
}

declare class MountItem {
    el: HTMLElement;
    eventList: Record<string, (event: Event) => void>;
    watchList: WatchStopHandle[];
    hasFocus: boolean;
    constructor(el: HTMLElement);
    event(eventName: string, func?: (event: Event) => void): void;
    watch<T>(watchFunc: WatchSource<T>, func: WatchCallback<T, T>, immediate?: boolean): WatchStopHandle;
    unbind(): void;
}

/**
 * czy typ jest any
 */
type IsAny<T> = unknown extends T ? ([keyof T] extends [never] ? false : true) : false;
/**
 * deep partial
 */
type DeepPartial<T> = T extends object ? {
    -readonly [P in keyof T]?: DeepPartial<T[P]>;
} : T;
/**
 * typ lub typ zwracany
 */
type PropOrFunc<T> = T extends () => any ? ReturnType<T> : T;
/**
 * pobranie typu wg ścieżki np: definitions/item
 */
type GetByPath<T, Path extends string> = Path extends `${infer Key}/${infer RestPath}` ? Key extends keyof T ? GetByPath<T[Key], RestPath> : null : Path extends string ? Path extends keyof T ? T[Path] : null : null;
/**
 * rozwiązanie $ref w obiekcie w którym $ref jest ustawione
 */
type ResolveRefType<T extends {
    $ref: string;
}, RootType = T> = T['$ref'] extends `#` ? RootType & Omit<T, '$ref'> : T['$ref'] extends `#/${infer Path}` ? GetByPath<RootType, Path> & Omit<T, '$ref'> : T['$ref'] extends `./${infer Path}` ? GetByPath<T, Path> & Omit<T, '$ref'> : T['$ref'] extends `/${infer Path}` ? GetByPath<T, Path> & Omit<T, '$ref'> : Omit<T, '$ref'>;
/**
 * rozwiązanie $ref w obiekcie jeśli istnieje
 */
type FixRefType<T, RootType = T> = T extends {
    $ref: string;
} ? ResolveRefType<T, RootType> : T;
/**
 * Ze wskazanego typu omija pola `*` oraz `_`.
 */
type NoStar<T> = Omit<T, '*' | '_'>;
/**
 * Ze wskazanego typu omija pola z drugiego typu oraz `*` i `_`
 */
type OmitAndStar<T, T2> = Omit<T, keyof T2 | '*' | '_'>;
type KeysOmitStar<T1, T2> = Exclude<keyof T1 | keyof T2, '*' | '_'>;
type DisabledType<T> = T extends {
    disabled: infer K;
} ? {
    disabled: K;
} : unknown;
type MergeSchemaTypes<Type1, Type2> = Type1 extends {
    properties: infer Properties1;
} ? Type2 extends {
    properties: infer Properties2;
} ? {
    type: 'object';
    properties: {
        [K in KeysOmitStar<Properties1, Properties2>]: K extends keyof Properties1 ? K extends keyof Properties2 ? MergeSchemaTypes<Properties1[K], Properties2[K]> : Properties1[K] : K extends keyof Properties2 ? Properties2[K] : unknown;
    };
} & (Type2 extends {
    disabled: infer K;
} ? {
    disabled: K;
} : DisabledType<Type1>) : Type1 & DisabledType<Type2> : Type1 extends {
    items: infer Items1;
} ? Type2 extends {
    items: infer Items2;
} ? {
    type: 'array';
    items: MergeSchemaTypes<Items1, Items2>;
} & (Type2 extends {
    disabled: infer K;
} ? {
    disabled: K;
} : DisabledType<Type1>) : Type1 & DisabledType<Type2> : Type2 extends {
    properties: any;
} ? Type2 : Type2 extends {
    items: any;
} ? Type2 : Type1 & DisabledType<Type2>;
/**
 * Uproszczone połaczenie typów dwóch schematów, tylko na pierszym poziomie, dopisuje tylko nowe pola, stare zostają
 */
type MergeSchemaTypesSimple<Type1, Type2> = Type1 extends {
    properties: any;
} ? Type2 extends {
    properties: any;
} ? {
    type: 'object';
    properties: {
        [K in keyof NoStar<Type1['properties']>]: Type2['properties'][K] extends {
            properties: any;
        } | {
            items: any;
        } | {
            type: any;
        } ? Type2['properties'][K] : Type1['properties'][K];
    } & {
        [V in keyof OmitAndStar<Type2['properties'], Type1['properties']>]: Type2['properties'][V];
    };
} : Type1 : Type1 extends {
    items: any;
} ? Type2 extends {
    items: any;
} ? {
    type: 'array';
    items: MergeSchemaTypesSimple<Type1['items'], Type2['items']>;
} : Type1 : Type1;
/**
 * połaczenie dwóch typów, typy proste są nadpisywane
 */
type MergeTypes<Type1, Type2 = null> = Type2 extends null ? Type1 : Type2 extends number | string | boolean | Array<any> | Function ? Type2 : Type2 extends Array<any> ? Type2 : {
    [K in keyof Type1]-?: K extends keyof Type2 ? MergeTypes<Type1[K], Type2[K]> : Type1[K];
} & {
    [K in keyof Omit<Type2, keyof Type1>]-?: Type2[K];
};
/**
 * połaczenie dwóch typów, typy proste są nadpisywane, a $ref są rozwiązywane
 */
type MergeTypesRoot<RootType, Type1, Type2 = null> = Type2 extends null ? FixRefType<Type1, RootType> : Type2 extends number | string | boolean | Array<any> ? Type2 : Type2 extends Array<any> ? Type2 : Type1 extends {
    $ref: any;
} ? MergeTypesRoot<RootType, ResolveRefType<Type1, RootType>, Type2> : Type2 extends {
    $ref: any;
} ? MergeTypesRoot<RootType, Type1, ResolveRefType<Type2, RootType>> : {
    [K in keyof Type1]-?: K extends keyof Type2 ? MergeTypesRoot<RootType, Type1[K], Type2[K]> : FixRefType<Type1[K], RootType>;
} & {
    [K in keyof Omit<Type2, keyof Type1>]-?: FixRefType<Type2[K], RootType>;
};
/**
 * połaczenie tablizy typów
 */
type MergeTypesRootArr<RootType, T> = T extends readonly [infer Item0, ...infer RestItems] ? RestItems extends [] ? FixRefType<Item0, RootType> : MergeTypes<FixRefType<Item0, RootType>, MergeTypesRootArr<RootType, RestItems>> : T extends [infer Item0, ...infer RestItems] ? RestItems extends [] ? FixRefType<Item0, RootType> : MergeTypes<FixRefType<Item0, RootType>, MergeTypesRootArr<RootType, RestItems>> : T extends Array<infer K> ? MergeTypesRoot<RootType, {}, K> : {};
/**
 * prosty typ na podstawie typu pola `type`
 */
type SimpleByType<T> = T extends {
    type: EnumType<infer K>;
} ? K : T extends {
    type: 'string';
} ? string : T extends {
    type: 'number' | 'money' | 'integer' | 'int';
} ? number : T extends {
    type: 'boolean';
} ? boolean : T extends {
    type: string;
} ? string | number | boolean : any;
/**
 * tworzy typ na podstawie schematu: `let model: FromSchema<typeof schema>`
 */
type FromSchema<T, RootType = T> = IsAny<T> extends true ? any : T extends {
    allOf: any;
} ? FromSchema<MergeTypes<T extends {
    $ref: string;
} ? ResolveRefType<Omit<T, 'allOf'>, RootType> : Omit<T, 'allOf'>, MergeTypesRootArr<RootType, T['allOf']>>, RootType> : T extends {
    $ref: string;
} ? FromSchema<ResolveRefType<T, RootType>, RootType> : T extends {
    properties: any;
} ? {
    -readonly [K in keyof T['properties']]-?: FromSchema<PropOrFunc<T['properties'][K]>, RootType>;
} : T extends {
    items: any;
} ? Array<FromSchema<PropOrFunc<T['items']>, RootType>> : SimpleByType<T>;
/**
 * tworzy typ na podstawie schematu, bez rozwiązywanie allOf i $ref
 */
type FromSchemaSimple<T> = IsAny<T> extends true ? any : T extends {
    properties: infer Properties;
} ? FromSchemaSimpleProperties<Properties> : T extends {
    items: infer Items;
} ? Array<FromSchemaSimple<PropOrFunc<Items>>> : SimpleByType<T>;
type FromSchemaSimpleProperties<Properties> = {
    -readonly [K in keyof Properties]-?: FromSchemaSimple<PropOrFunc<Properties[K]>>;
};
type FromSchemaSimpleNonComputed<T> = IsAny<T> extends true ? any : T extends {
    properties: infer Properties;
} ? FromSchemaSimplePropertiesNonComputed<Properties> : T extends {
    items: infer Items;
} ? Array<FromSchemaSimpleNonComputed<PropOrFunc<Items>>> : SimpleByType<T>;
/**
 * pomija pola computed
 */
type NonComputedProps<Properties> = {
    [K in keyof Properties as Properties[K] extends {
        computed: any;
    } ? never : K]: Properties[K];
};
/**
 * pomija pola disabled
 */
type NonDisabledProps<Properties> = {
    [K in keyof Properties as Properties[K] extends {
        disabled: any;
    } ? never : K]: Properties[K];
};
/**
 * zwraca pola disabled
 */
type DisabledProps<Properties> = {
    [K in keyof Properties as Properties[K] extends {
        disabled: any;
    } ? K : never]: Properties[K];
};
/**
 * zwraca pola w zalażności czy są disabled
 */
type FromSchemaSimplePropertiesNonComputed<Properties, NonComputed = NonComputedProps<Properties>> = {
    -readonly [K in keyof NonDisabledProps<NonComputed>]-?: FromSchemaSimpleNonComputed<PropOrFunc<NonComputed[K]>>;
} & {
    -readonly [K in keyof DisabledProps<NonComputed>]+?: FromSchemaSimpleNonComputed<PropOrFunc<NonComputed[K]>>;
};
/**
 * tworzy typ z polami nieobowiązkowymi na podstawie schematu: `let model: PartialFromSchema<typeof schema>`
 */
type PartialFromSchema<T, RootType = T> = IsAny<T> extends true ? any : T extends {
    allOf: any;
} ? PartialFromSchema<MergeTypes<T extends {
    $ref: string;
} ? ResolveRefType<Omit<T, 'allOf'>, RootType> : Omit<T, 'allOf'>, MergeTypesRootArr<RootType, T['allOf']>>, RootType> : T extends {
    $ref: string;
} ? PartialFromSchema<ResolveRefType<T, RootType>, RootType> : T extends {
    properties: infer Properties;
} ? {
    -readonly [K in keyof Properties]?: PartialFromSchema<PropOrFunc<Properties[K]>, RootType>;
} : T extends {
    items: infer Items;
} ? Array<PartialFromSchema<PropOrFunc<Items>, RootType>> : SimpleByType<T>;
/**
 * tworzy typ z polami nieobowiązkowymi na podstawie schematu: `let model: PartialFromSchema<typeof schema>`
 */
type PartialFromSchemaSimple<T, RootType = T> = IsAny<T> extends true ? any : T extends {
    properties: infer Properties;
} ? {
    -readonly [K in keyof Properties]?: PartialFromSchemaSimple<PropOrFunc<Properties[K]>, RootType>;
} : T extends {
    items: infer Items;
} ? Array<PartialFromSchemaSimple<PropOrFunc<Items>, RootType>> : SimpleByType<T>;
/**
 * tworzenie typu IWrappedProperty na podstawie schematu
 */
type FromSchemaProperty<T, ExternalType = any, FormType = any, RootType = T> = IsAny<T> extends true ? IWrappedPropertyWithProps<T, ExternalType, FormType> : T extends {
    data: any;
} ? FromSchemaProperty<Omit<T, 'data'>, ExternalType, FormType, RootType> & {
    $data: T['data'] & Record<string, any>;
} : T extends {
    allOf: any;
} ? FromSchemaProperty<MergeTypes<T extends {
    $ref: string;
} ? ResolveRefType<Omit<T, 'allOf'>, RootType> : Omit<T, 'allOf'>, MergeTypesRootArr<RootType, T['allOf']>>, ExternalType, FormType, RootType> : T extends {
    $ref: string;
} ? FromSchemaProperty<ResolveRefType<T, RootType>, ExternalType, FormType, RootType> : T extends {
    properties: infer Properties;
} ? //IWrappedPropertyObject<FromSchemaSimple<T>, ExternalType, FormType> & { [K in keyof T['properties']]: FromSchemaProperty<T['properties'][K], ExternalType, FormType, RootType> } :
IWrappedPropertyObject<{
    [K in keyof Properties]: FromSchema<Properties[K]>;
}, ExternalType, FormType> & {
    [K in keyof Properties]: FromSchemaProperty<Properties[K], ExternalType, FormType, RootType>;
} & {
    $fields: {
        [K in keyof Properties]: FromSchemaProperty<Properties[K], ExternalType, FormType, RootType>;
    };
} : T extends {
    items: infer Items;
} ? IWrappedPropertyArray<FromSchemaProperty<Items, ExternalType, FormType, RootType> & {
    $key: number;
}, FromSchema<Items>, ExternalType, FormType> : T extends {
    type: EnumType<infer K>;
} ? IWrappedProperty<K, ExternalType, FormType> : T extends {
    type: 'string';
} ? IWrappedProperty<string, ExternalType, FormType> : T extends {
    type: 'number' | 'money' | 'integer' | 'int';
} ? IWrappedProperty<number, ExternalType, FormType> : T extends {
    type: 'boolean';
} ? IWrappedProperty<boolean, ExternalType, FormType> : T extends {
    type: string;
} ? IWrappedProperty<string | number | boolean, ExternalType, FormType> : IWrappedPropertyWithProps;
type FromSchemaPropertyObject<T, ExternalType = any, FormType = any, RootType = any, Properties = T extends {
    properties: infer K;
} ? K : any, Fields = {
    [K in keyof Properties]-?: FromSchemaPropertySimple<Properties[K], ExternalType, FormType, RootType>;
}, ModelType = FromSchemaSimpleProperties<Properties>> = IWrappedPropertyObject<ModelType, ExternalType, FormType, DeepPartial<ModelType>, FromSchemaSimplePropertiesNonComputed<Properties>> & Fields & {
    $fields: Fields;
};
type FromSchemaPropertyArray<SchemaItemType, ExternalType = any, FormType = any, RootType = any, FS = FromSchemaPropertySimple<SchemaItemType, ExternalType, FormType, RootType> & {
    $key: number;
}> = IWrappedPropertyArray<FS, FS extends {
    $model: any;
} ? FS['$model'] : any, ExternalType, FormType>;
/**
 * typ do propsa na podstawie definicji schematu
 */
type SchemaPropType<SchemaType> = PropType<FromSchemaPropertySimple<SchemaType>>;
/**
 * typ do propsa na podstawie definicji schematu będącego elementem tabeli
 */
type SchemaPropTypeArray<SchemaItemType> = PropType<FromSchemaPropertyArray<SchemaItemType>>;
/**
 * typ rozszerzający typ prostu
 */
type EnumType<T> = 'integer' & {
    internalType: T;
};
/**
 * tworzenie typu IWrappedProperty na podstawie schamtu (bez obsługi allof i $ref)
 */
type FromSchemaPropertySimple<T, ExternalType = any, FormType = any, RootType = T> = IsAny<T> extends true ? IWrappedPropertyWithProps<T, ExternalType, FormType> : T extends {
    data: any;
} ? FromSchemaPropertySimple<Omit<T, 'data'>, ExternalType, FormType, RootType> & {
    $data: T['data'] & Record<string, any>;
} : T extends {
    properties: any;
} ? FromSchemaPropertyObject<T, ExternalType, FormType, RootType> : T extends {
    items: infer Items;
} ? FromSchemaPropertyArray<Items, ExternalType, FormType, RootType> : T extends {
    type: EnumType<infer K>;
} ? IWrappedProperty<K, ExternalType, FormType> : T extends {
    type: 'string';
} ? IWrappedProperty<string, ExternalType, FormType> : T extends {
    type: 'number' | 'money' | 'integer' | 'int';
} ? IWrappedProperty<number, ExternalType, FormType> : T extends {
    type: 'boolean';
} ? IWrappedProperty<boolean, ExternalType, FormType> : T extends {
    type: string;
} ? IWrappedProperty<string | number | boolean, ExternalType, FormType> : IWrappedPropertyWithProps;
type ExternalFieldType<T> = T extends {
    $external: any;
} ? T['$external'] : any;
/**
 * tworzenie typu IWrappedProperty na podstawie typu
 */
type SchemaInterface<T, ExternalType = ExternalFieldType<T>, FormType = any, RootType = T> = T extends (...args: any) => any ? SchemaInterface<ReturnType<T>, ExternalType, FormType, RootType> : IsAny<T> extends true ? IWrappedPropertyWithProps<T, ExternalType, FormType> : T extends Array<infer K> ? IWrappedPropertyArray<SchemaInterface<K> & {
    readonly $key: number;
}, K, ExternalType, FormType> : T extends boolean ? IWrappedProperty<boolean, ExternalType, FormType> : T extends number ? IWrappedProperty<number, ExternalType, FormType> : T extends string ? IWrappedProperty<string, ExternalType, FormType> : T extends object ? IWrappedProperty<T, ExternalType, FormType> & {
    -readonly [K in keyof T]-?: SchemaInterface<T[K], ExternalType, FormType, RootType> & {
        readonly $key: K;
    };
} : T extends undefined ? IWrappedPropertyWithProps<T, ExternalType, FormType> & {
    $items: Array<{
        $key: number;
        $item: SchemaInterface<undefined, ExternalType, FormType, RootType>;
    }>;
} : IWrappedPropertyWithProps<T, ExternalType, FormType>;

interface IValidationMessages {
    type?: string;
    number?: string;
    money?: string;
    integer?: string;
    required?: string;
    fieldRequired?: string;
    minimum?: string;
    maximum?: string;
    exclusiveMinimum?: string;
    exclusiveMaximum?: string;
    multipleOf?: string;
    maxLength?: string;
    minLength?: string;
    maxItems?: string;
    minItems?: string;
    enum?: string;
    format?: string;
    pattern?: string;
    validFunc?: string;
    'format.nip'?: string;
    'format.url'?: string;
    'format.email'?: string;
    'format.kod'?: string;
}

interface II18N {
    t: (key: string, options?: any) => string;
    exists: (key: string, options?: any) => boolean;
    changeLanguage: (lang: string) => void;
    on(event: 'languageChanged', listener: (lng: string) => void): void;
    off(event: 'languageChanged', listener?: (lng: string) => void): void;
    language: string;
}
interface II18NSimple {
    language: string;
    t: II18N['t'];
    instance: II18N;
}
/**
 * bazująca na strukturze zgodnej z DayJS
 */
interface ILang {
    name: string;
    weekdays: string[];
    weekdaysShort: string[];
    weekdaysMin: string[];
    weekStart: number;
    yearStart: number;
    months: string[];
    monthsShort: string[];
    ordinal: (n: number) => string;
    /**
     * funkcja formatująca datę z formatu RFC do lang
     * @param sdate
     * @returns
     */
    shortDateFormatter: (sdate: string) => string;
    /**
     * funkcja formatująca datę z formatu RFC do długiej daty: 7 marca 2024
     * @param sdate
     * @returns
     */
    longDateFormatter: (sdate: Date) => string;
    /**
     * funkcja reformatująca datę z formatu lang to RFC
     * @param sdate
     * @returns
     */
    shortDateReformatter: (sdate: string) => string;
    formatSpaceNumber: (value: number | bigint) => string;
    formats: {
        LTS: string;
        LT: string;
        L: string;
        LL?: string;
        LLL?: string;
        LLLL?: string;
        l?: string;
        ll?: string;
        lll?: string;
        llll?: string;
    };
    relativeTime: {
        future: string;
        past: string;
        s: string;
        m: string;
        mm: string;
        h: string;
        hh: string;
        d: string;
        dd: string;
        M: string;
        MM: string;
        y: string;
        yy: string;
    };
    meridiem: (hour: number, minute?: number, isLowercase?: boolean) => string;
    decimalSeparator: string;
    groupSeparator: string;
}
declare function createLang(name: string): ILang;
declare const defaultLang: {
    current: ILang;
    setLang(name: string): void;
};

interface IOptions<ExternalType = any, FormType = any, PrevModelType = any> {
    /**
     * czy ma czyścić błedy na focus, domyślnie `true`
     */
    resetOnFocus?: boolean;
    /**
     * czy ma ustawiać dirty na każdej zmianie pola, domyślnie `false`
     */
    dirtyOnInput?: boolean;
    /**
     * czy ma ustawiac dirty po wyjściu z pola, domyślnie `true`
     */
    dirtyOnBlur?: boolean;
    /**
     * czy ma ustawiac dirty przeliczeniu pola, domyślnie `true`
     */
    startDirtyOnCalc?: boolean;
    /**
     * czy wszystkie na starcie powinny byc dirty, domyślnie `false`
     */
    startDirty?: boolean;
    /**
     * czy dla pól numerycznych zwracać $value stringiem gdy jest focus
     */
    lazyNumbers?: boolean;
    /**
     * czy automatycznie obudowywać wszystko, domyślnie `false`
     * obudowuje wszystko w przypadku prostych modeli
     */
    wrapAll?: boolean;
    /**
     * czy wyłaczyć kalkulacje, domyślnie `false`
     */
    disableCalculations?: boolean;
    /**
     * czy wyłączyć validacje, domyślnie `false`
     */
    disableValidations?: boolean;
    /**
     * dane formularza
     */
    form?: FormType;
    /**
     * dane zewnętrzne
     */
    external?: ExternalType;
    /**
     * dodatkowe funkcje schematu
     */
    schemaMethods?: any;
    /**
     * komunikaty walidacji
     */
    validationMessages?: IValidationMessages;
    /**
     * komunikaty warnings
     */
    warningMessages?: IValidationMessages;
    /**s
     * czy naprawiać model, dodawać brakujące pola, domyślnie `true`
     */
    fixData?: boolean;
    /**
     * czy naprawiać model, ustawić formatowanie pól data, date-time, uppercase itp., domyślnie `false`
     */
    fixFormat?: boolean;
    /**
     * czy naprawiać model, typy danych i formatowanie, domyślnie `false`
     */
    fixTypes?: boolean;
    /**
     * czy logować błędy wyliczeń (calc, validFunc i inne)
     */
    logErrors?: boolean;
    /**
     * czy logować warningi wyliczeń (np. błedne wyniki calc)
     */
    logWarnings?: boolean;
    /**
     * dodaje do każdego obiektu będącego elementem tablicy pole typu guid o tej nazwie
     *
     * @type {string}
     * @memberof IOptions
     */
    arrayItemGuidField?: string;
    /**
     * czy wszystkie pola mają być readOnly
     */
    readOnly?: boolean;
    /**
     * czy tworzyć długie pełne guidy
     */
    longGuids?: boolean;
    /**
     * czy pole date-time przechowuje UTC ?
     */
    utc?: boolean;
    /**
     * czy ma być dostępna funkcja $forceCalc
     */
    forceCalcEnabled?: boolean;
    /**
     * język
     */
    lang?: string;
    /**
     * interfejs tłumaczenia podany ręcznie
     */
    i18n?: II18N;
    /**
     * automatyczny prefix i18 dla title
     */
    langKeyPrefix?: string;
    /**
     * poprzedni model do porównania
     */
    prevModel?: PrevModelType;
    /**
     * gdy true, to w this jest tylko model, nie ma $methods itp
     */
    simpleThis?: boolean;
    /**
     * lista wyłaczonych pól, do użytku wewnętrznego
     */
    _disabledFields?: Set<string>;
    /**
     * list pól na których odczytano właściwośc $error do późniejszej walidacji
     */
    _readedErrorFields?: Set<IWrappedProperty>;
    /**
     * czy podpięte są jakiekolwiek eventy
     */
    _anyEvent?: Record<PropertyEventType, boolean | undefined>;
    /**
     * wymysza recalc wszystkich dynamicznych funckji
     */
    _forceRecalc?: Ref<number>;
    /**
     * czy uytkownik zmienił jakoś pole
     */
    _userInput?: boolean;
    _lang?: Ref<ILang>;
    _i18n?: Ref<II18NSimple>;
}
/**
 * domyslne opcje schematu
 */
declare const defaultOptions: IOptions;
/**
 * dołaczanie opcji *
 * @export
 * @param {IOptions} options
 * @param {IOptions} optionsToMerge
 * @param {number} level poziom opcji
 */
declare function mergeOptions(options: IOptions, optionsToMerge: IOptions, level?: number): void;

interface IArrayItemExt {
    /**
     * usuń wiersz
     */
    $removeRow(): void;
    /**
     * przesuń wiwersz w gó®ę
     */
    $moveUp(): void;
    /**
     * przesuń wiersz w dół
     */
    $moveDown(): void;
    /**
     * wyczyśc wiersz
     */
    $clearRow(): void;
}
interface IWrapperPropertyArrayItem<ItemType = IWrappedProperty, ModelType = any> {
    $key: number;
    $item: ItemType & IArrayItemExt;
    /**
     * wyczyśc cache, ponownie renderuj
     */
    $clearCache(): boolean;
    /**
     * ustaw nowy klucz
     * @param newKey nowy klucz
     */
    $setKey(newKey: number): void;
    /**
     * usuń wiersz
     */
    $remove(): void;
    /**
     * wyczyśc wiersz
     */
    $clear(): void;
    /**
     * przesuń w górę
     */
    $moveUp(): void;
    /**
     * przesuń w dół
     */
    $moveDown(): void;
    /**
     * wiersz
     */
    $model: ModelType;
    $guid: string | undefined;
    $diffStatus: '' | 'new' | 'del';
}

interface ISchemaAggregate {
    /**
     * tabela do przeliczenia
     */
    array: string | string[];
    /**
     * property z wiersza
     */
    property?: string;
    func?: 'sum' | 'avg' | 'mul' | 'min' | 'max' | 'map' | 'first' | 'last' | 'count' | 'distinct' | 'distinctitem';
    /**
     * kiedy uwzględniać wiersz
     */
    when?: string;
    /**
     * kiedy uwzględniać wiersz, to samo co when
     */
    if?: string;
    /**
     * czy opóźnić przeliczenie
     */
    delay?: number;
}

interface ISchemaCalc {
    /**
     * funkcja
     */
    func: string | string[] | readonly string[];
    /**
     * kiedy liczyć, gdy false, to nie aktualizuje modelu
     */
    when?: string;
}

interface ISchemaSummary {
    array: string;
    property: string;
    when: string;
    if: string;
    delay: number;
}

declare const patterns: {
    DATE0: RegExp;
    TIME: RegExp;
    /**
     * kod pocztowy: 76-200
     */
    KOD_POCZTOWY: RegExp;
    HOSTNAME: RegExp;
    NOT_URI_FRAGMENT: RegExp;
    URI: RegExp;
    URL: RegExp;
    UUID: RegExp;
    IPv4: RegExp;
    IPv6: RegExp;
    Z_ANCHOR: RegExp;
    /**
     * numer konta bankowego, np. PL61109010140000071219812874 lub PL61 1090 1014 0000 0712 1981 2874, 61 1090 1014 0000 0712 1981 2874
     */
    IBAN: RegExp;
    EMAIL: RegExp;
    /**
     * guid z kreskami
     */
    GUID: RegExp;
    /**
     * guid skrócony
     */
    GUID12: RegExp;
    /**
     * liczba
     */
    NUMERIC: RegExp;
    /**
     * numer 9 cyfrowy
     */
    PHONE9: RegExp;
    PHONE: RegExp;
    DOWOD: RegExp;
    EDOWOD: RegExp;
    PASSPORT: RegExp;
    NIP: RegExp;
    NIP_NUMBERSONLY: RegExp;
    KW: RegExp;
    PESEL: RegExp;
    LCASE_UCASE_NUMBER_SPECIAL_8PLUS: RegExp;
};
type Patterns = typeof patterns;
type CreatePatternOptions = {
    /**
     * czy wymagana jest mała litera
     */
    requireLowercase?: boolean;
    /**
     * czy wymagana jest duża litera
     */
    requireUppercase?: boolean;
    /**
     * czy wymagana jest cyfra
     */
    requireNumber?: boolean;
    /**
     * czy wymagany znak specjalny
     */
    requireSpecial?: boolean;
    /**
     * minimalna długość hasła
     */
    minLength?: number;
    /**
     * maksymalna długość hasła
     */
    maxLength?: number;
};
/**
 * tworzy wzorzec dla hasła
 * @param options opcje hasła
 * @returns
 */
declare function createPasswordPattern(options: CreatePatternOptions): RegExp;
/**
 * data yyyy-MM-dd, lub yyyy-MM-dd 00:00:00
 * sprawdza również czy data jest prawidłowa, wraz ze sprawdzaniem roku przestępnego
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function date(str: string): boolean;
/**
 * czas HH:m:ss
 *
 * @export
 * @param {string} str
 * @param {boolean} [full] czy wymagana jest strea czasowa
 * @returns {boolean}
 */
declare function time(str: string, full?: boolean): boolean;
/**
 * kod pocztowy: 76-200
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function kod(str: string): boolean;
/**
 * data z czasem, yyyy-MM-dd HH:mm:ss
 * mogą być rozdzielone `t` lub ` `
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function date_time(str: string): boolean;
/**
 * URI, np. file://xvxvx
 *
 * @export
 * @param {string} str
 * @returns
 */
declare function uri(str: string): boolean;
/**
 * URL, np. https://google.com
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function url(str: string): boolean;
/**
 * UUID
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function uuid(str: string): boolean;
/**
 * RegEx
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function regex(str: string): boolean;
/**
 * NIP: 9570716562
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function nip(str: string): boolean;
/**
 * numer księgi wieczystej: GD1G/00000125/6
 *
 * @export
 * @param {string} str
 * @returns
 */
declare function kw(str: string): boolean;
/**
 * PESEL: 77010904673
 *
 * @export
 * @param {string} str
 * @returns
 */
declare function pesel(str: string): boolean;
/**
 * regon (9 znakowy): 220318890
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function regon9(str: string): boolean;
/**
 * regon (14 znakowy)
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function regon14(str: string): boolean;
/**
 * regon, sprawdza zarówno wersje 9 oraz 14 znakową
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function regon(str: string): boolean;
/**
 * numer rachunku w postaci IBAN (26 znaków, moga być ze spacjami)
 * 67 1140 2004 0000 3602 1050 8845
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function iban(str: string): boolean;
/**
 * seria i numer dowodu: AVG793448
 *
 * @export
 * @param {string} str
 * @returns
 */
declare function dowod(str: string): boolean;
/**
 * seria i numer edowodu: MACU27728
 *
 * @export
 * @param {string} str
 * @returns
 */
declare function edowod(str: string): boolean;
/**
 * email, daniel@jursza.com
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function email(str: string): boolean;
/**
 * guid, d020cc46-c999-4ba5-a7d0-8ddb13ade32c lub 8ddb13ade32c
 * 3 segment musi się zaczynać od cyfry 1-5
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function guid(str: string): boolean;
/**
 * guidlong, d020cc46-c999-4ba5-a7d0-8ddb13ade32c
 * 3 segment musi się zaczynać od cyfry 1-5
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function guidlong(str: string): boolean;
/**
 * guidshort, 8ddb13ade32c
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function guidshort(str: string): boolean;
/**
 * czy to liczba, same cyfry
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function numeric(str: string): boolean;
/**
 * 9 cyfrowy numer telefonu, same cyfry
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function phone9(str: string): boolean;
/**
 * numer telefonu, same cyfry
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function phone(str: string): boolean;
/**
 * seria i numer paszportu
 *
 * @export
 * @param {string} str
 * @returns {boolean}
 */
declare function passport(str: string): boolean;
declare const formatFunctions: {
    readonly date: typeof date;
    readonly time: typeof time;
    readonly date_time: typeof date_time;
    readonly 'date-time': typeof date_time;
    readonly nip: typeof nip;
    readonly regon: typeof regon;
    readonly regon9: typeof regon9;
    readonly regon14: typeof regon14;
    readonly kw: typeof kw;
    readonly dowod: typeof dowod;
    readonly edowod: typeof edowod;
    readonly passport: typeof passport;
    readonly guid: typeof guid;
    readonly guidlong: typeof guidlong;
    readonly guidshort: typeof guidshort;
    readonly numeric: typeof numeric;
    readonly phone9: typeof phone9;
    readonly phone: typeof phone;
    readonly email: typeof email;
    readonly iban: typeof iban;
    readonly pesel: typeof pesel;
    readonly kod: typeof kod;
    readonly kodpocztowy: typeof kod;
    readonly nrb: typeof iban;
    readonly uri: typeof uri;
    readonly url: typeof url;
    readonly uuid: typeof uuid;
    readonly regex: typeof regex;
};
type CheckFormatType = keyof typeof formatFunctions;
declare function checkFormat(format: CheckFormatType, data: any): boolean;

/**
 * interfejs do wyliczalnego schema
 *
 * @export
 * @interface IfValue
 */
interface IfValue {
    /**
     * warunek
     *
     * @type {string}
     * @memberof IfValue
     */
    if?: string;
    /**
     * zwracana wartość, jeśli tekstowa to trzeba w cudzysłowach
     *
     * @type {string}
     * @memberof IfValue
     */
    value?: string;
}
type JSONSchemaFieldType = 'money' | 'integer' | 'string' | 'number' | 'object' | 'array' | 'boolean';
type JSONSchemaFieldFormat = 'capitalize' | 'date' | 'date-time' | 'dowod' | 'edowod' | 'email' | 'guid' | 'guidshort' | 'guidlong' | 'hostname' | 'iban' | 'ipv4' | 'ipv6' | 'kod' | 'kw' | 'lowercase' | 'nip' | 'numeric' | 'pesel' | 'time' | 'phone9' | 'regon' | 'regon9' | 'regon14' | 'uppercase' | 'uri' | 'url' | 'passport';
/**
 * lista walidatorów do schematu
 *
 * @export
 * @interface JSONValidators
 */
interface JSONValidators<ExtendsPropType = never> {
    /**
     * wartośc minimalna
     *
     * @type {(number | string | string[])}
     * @memberof JSONValidators
     */
    minimum?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * musi być większe od tej wartości
     *
     * @type {(number | string | string[])}
     * @memberof JSONValidators
     */
    exclusiveMinimum?: number | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * maksymalna wartość
     *
     * @type {(number | string | string[])}
     * @memberof JSONValidators
     */
    maximum?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * musi być mniejsze od tej wartości
     *
     * @type {(number | string | string[])}
     * @memberof JSONValidators
     */
    exclusiveMaximum?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * czy jest wielokrotnością
     *
     * @type {(number | string | string[])}
     * @memberof JSONValidators
     */
    multipleOf?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * maksymalna długość tekstu
     *
     * @type {(number | string | string[])}
     * @memberof JSONValidators
     */
    maxLength?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * mimimalna długość tekstu
     *
     * @type {(number | string | string[])}
     * @memberof JSONValidators
     */
    minLength?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * maksymalan liczba elementów w tablcy
     *
     * @type {(number | string | string[])}
     * @memberof JSONValidators
     */
    maxItems?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * minimalna liczba elementów w tablicy
     *
     * @type {(number | string | string[])}
     * @memberof JSONValidators
     */
    minItems?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * pattern RegEx
     *
     * @type {string}
     * @memberof JSONValidators
     */
    pattern?: RegExp | keyof Patterns | ExtendsPropType | (string & {});
    /**
     * flagi do RegExa określonego przez `pattern`, domyślnie 'i'
     *
     * @type {string}
     * @memberof JSONValidators
     */
    patternFlags?: null | string;
    /**
     * format tekstu
     *
     * @type {('date'
     *     | 'date-time'
     *     | 'dowod'
     *     | 'edowod'
     *     | 'email'
     *     | 'guid'
     *     | 'hostname'
     *     | 'iban'
     *     | 'ipv4'
     *     | 'ipv6'
     *     | 'kod'
     *     | 'kw' // księga wieczysta
     *     | 'nip'
     *     | 'numeric'
     *     | 'pesel'
     *     | 'time'
     *     | 'phone9'
     *     | 'regon'
     *     | 'regon9'
     *     | 'regon14'
     *     | 'uri'
     *     | 'url'
     *     | 'passport')}
     * @memberof JSONValidators
     */
    format?: JSONSchemaFieldFormat;
    /**
     * tylko do odczytu
     *
     * @type {boolean | string}
     * @memberof JSONValidators
     */
    readOnly?: boolean | string | string[] | readonly string[] | ExtendsPropType;
    /**
     * które pola są wymagane
     *
     * @type {string[]}
     * @memberof JSONValidators
     */
    required?: string[] | readonly string[] | ExtendsPropType;
    /**
     * tablica prawidłowych wartości
     *
     * @type {(any[] | string)}
     * @memberof JSONValidators
     */
    enum?: string | any[] | readonly any[] | ExtendsPropType;
    /**
     * funkcja dwolnie walidująca
     *
     * @type {(string | string[])}
     * @memberof JSONValidators
     */
    validFunc?: string | string[] | readonly string[] | ExtendsPropType;
    /**
     * czy to pole jest wymagane
     *
     * @type {(boolean | string)}
     * @memberof JSONValidators
     */
    fieldRequired?: boolean | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    _validationFunctions?: any[];
}
type PropertiesType<ExtendsPropType> = {
    [key: string]: JSONSchema<ExtendsPropType>;
};
/**
 * implementacja standardu Schemadraft07
 *
 * @export
 * @interface JSONSchemaDraft07
 * @extends {JSONValidators}
 */
interface JSONSchemaDraft07<ExtendsPropType = never> extends JSONValidators<ExtendsPropType> {
    $id?: string;
    $ref?: string;
    type?: string;
    /**
     * precyzja pola number, domyslnie 8
     *
     * @type {number}
     * @memberof JSONSchemaDraft07
     */
    precision?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * tytuł pola
     *
     * @type {(string | string[] | IfValue[])}
     * @memberof JSONSchemaDraft07
     */
    title?: string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * opis pola
     *
     * @type {(string | string[] | IfValue[])}
     * @memberof JSONSchemaDraft07
     */
    description?: string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * wartośc domyslna pola
     *
     * @type {*}
     * @memberof JSONSchemaDraft07
     */
    default?: any;
    /**
     * lista property
     *
     * @type {{ [key: string]: JSONSchema }}
     * @memberof JSONSchemaDraft07
     */
    properties?: PropertiesType<ExtendsPropType>;
    /**
     * lista definicji
     *
     * @type {{ [key: string]: JSONSchema }}
     * @memberof JSONSchemaDraft07
     */
    definitions?: {
        [key: string]: JSONSchema<ExtendsPropType>;
    };
    /**
     * definicja elementów tablicy
     *
     * @type {JSONSchema}
     * @memberof JSONSchemaDraft07
     */
    items?: JSONSchema<ExtendsPropType>;
    extends?: string;
}
/**
 * lista komunikatów z ostrzeżeniami
 *
 * @export
 * @interface JSONWarnings
 * @extends {JSONValidators}
 */
interface JSONWarnings<ExtendsPropType = never> extends JSONValidators<ExtendsPropType> {
    warningMessages?: IValidationMessages;
    [key: string]: any;
}
/**
 * Opcje CSV dla konkretnego property w JSchema
 *
 * @export
 * @interface ISchemaCsv
 */
interface ISchemaCsv {
    /**
     * Tytuł pola
     *
     * @type {string}
     * @memberof ISchemaCsv
     */
    title?: string;
    /**
     * Czy pole ma zostać zignorowane
     *
     * @type {boolean}
     * @memberof ISchemaCsv
     */
    ignore?: boolean;
    /**
     * Pozwala na igrnorowanie `computed`
     * Czasem chcemy aby cały obiekt był `computed` (ignorowane przy getData)
     * ale jednak wrzucać wartości jego dzieci do csv
     *
     * @type {boolean}
     * @memberof ISchemaCsv
     */
    ignoreComputed?: boolean;
    /**
     * Czy tytuł ma być prosty bez zagnieżdżenia (obiekty)
     *
     * @type {boolean}
     * @memberof ISchemaCsv
     */
    simpleTitle?: boolean;
    /**
     * Nazwa enuma
     *
     * @type {string}
     * @memberof ISchemaCsv
     */
    enum?: string;
}
/**
 * interfejs reprezentujący definicję schematu
 *
 * @export
 * @interface JSONSchema
 * @extends {JSONSchemaDraft07}
 */
interface JSONSchema<ExtendsPropType = never, ModelType = any> extends JSONSchemaDraft07<ExtendsPropType> {
    /**
     * typ pola w schemacie
     *
     * @type {('money' | 'integer' | 'string' | 'number' | 'object' | 'array' | 'boolean' | 'text')}
     * @memberof JSONSchema
     * @defaultValue `'string'`
     */
    type?: JSONSchemaFieldType;
    /**
     * skrócony tytuł pola
     *
     * @type {(string | string[] | IfValue[])}
     * @memberof JSONSchemaDraft07
     */
    shortTitle?: string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * element nadrzędny w schemacie
     *
     * @type {JSONSchema}
     * @memberof JSONSchema
     */
    $parent?: JSONSchema;
    /**
     * funkcja wyliczania wartości pola
     *
     * @type {(string | string[] | ISchemaCalc)}
     * @memberof JSONSchema
     */
    calc?: string | string[] | readonly string[] | ISchemaCalc | ExtendsPropType;
    /**
     * skrócony zapis `aggregate` z automatyczną funkcją `sum`
     *
     * @type {ISchemaSummary}
     * @memberof JSONSchema
     */
    summary?: ISchemaSummary;
    /**
     * definicja agregacji
     *
     * @type {ISchemaAggregate}
     * @memberof JSONSchema
     */
    aggregate?: ISchemaAggregate;
    /**
     * komunikaty walidacji
     *
     * @type {{ [key: string]: string }}
     * @memberof JSONSchema
     */
    validationMessages?: IValidationMessages;
    /**
     * czy pole jest polem wyliczanym, nie pojawaia się w wynikowych danych, ale zachowuje się normalnie
     *
     * @type {boolean}
     * @memberof JSONSchema
     */
    computed?: boolean;
    /**
     * czy pole ma być wyłaczone,
     * nie działają wtedy żadne kalkulacje ani walidacje,
     * a wartośc się ustawia na undefined (lub default jeśli jest)
     *
     * @type {(boolean | string)}
     * @memberof JSONSchema
     */
    disabled?: boolean | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * czy pole ma być debuggowane, zatrzymuje się przy każdym przeliczaniu nowej wartości pola
     *
     * @type {boolean}
     * @memberof JSONSchema
     */
    debug?: boolean;
    /**
     * czy ustawianie pola przez $value i calc ma być opóźniane, w [ms]
     *
     * @type {number}
     * @memberof JSONSchema
     */
    debounce?: number;
    /**
     * łączenie wielu schematów w jeden
     *
     * @type {JSONSchema[]}
     * @memberof JSONSchema
     */
    allOf?: JSONSchema<ExtendsPropType>[] | readonly JSONSchema<ExtendsPropType>[];
    /**
     * wymuszenie ilości elementów w array
     *
     * @type {(number | string | string[])}
     * @memberof JSONSchema
     */
    length?: number | string | string[] | readonly string[] | IfValue[] | readonly IfValue[] | ExtendsPropType;
    /**
     * dowonle dane
     */
    data?: Record<string, any>;
    /**
     * definicje ostrzeżeń, identycznie jak w przypadku walidacji
     *
     * @type {JSONWarnings}
     * @memberof JSONSchema
     */
    warnings?: JSONWarnings<ExtendsPropType>;
    /**
     * ustawienia do CSV
     */
    csv?: ISchemaCsv;
    /**
     * czy pole zawiera dane osobowe które trzeba ukrywać
     */
    gdpr?: boolean;
    /**
     * ustawienia schematu
     *
     * @type {IOptions}
     * @memberof JSONSchema
     */
    $options?: IOptions;
    $on?: Partial<Record<PropertyEventType, PropertyEventDelegate<ExtendsPropType extends (...args: any) => any ? Parameters<ExtendsPropType>[0] : any> | string | string[]>>;
    [key: string]: any;
    calcFunc?: any;
    summaryFunc?: any;
    validFuncCompiled?: any;
    aggregateFunc?: any;
}

interface IInvalidValue {
    $path: string;
    $value: string;
}
interface IWrappedPropertySchemaValidators {
    /**
     * wartośc minimalna
     */
    minimum?: number;
    /**
     * musi być większe od tej wartości
     */
    exclusiveMinimum?: number;
    /**
     * maksymalna wartość
     */
    maximum?: number;
    /**
     * musi być mniejsze od tej wartości
     */
    exclusiveMaximum?: number;
    /**
     * czy jest wielokrotnością
     */
    multipleOf?: number;
    /**
     * maksymalna długość tekstu
     */
    maxLength?: number;
    /**
     * mimimalna długość tekstu
     */
    minLength?: number;
    /**
     * maksymalna liczba elementów w tablcy
     */
    maxItems?: number;
    /**
     * minimalna liczba elementów w tablicy
     */
    minItems?: number;
    /**
     * tylko do odczytu
     */
    readOnly?: boolean;
    /**
     * czy to pole jest wymagane
     */
    fieldRequired?: boolean;
    /**
     * pattern RegEx
     */
    pattern?: string | RegExp;
    /**
     * flagi do RegExa określonego przez `pattern`
     */
    patternFlags?: string;
    /**
     * tablica prawidłowych wartości
     */
    enum?: any[];
    /**
     * format tekstu
     */
    format?: JSONSchemaFieldFormat;
}
interface IWrappedPropertySchema extends IWrappedPropertySchemaValidators {
    /**
     * typ pola
     */
    type?: JSONSchemaFieldType;
    /**
     * typ elementów w tablicy
     */
    itemType?: JSONSchemaFieldType;
    /**
     * tytuł pola
     */
    title?: string;
    /**
     * skrócony tytuł pola
     */
    shortTitle?: string;
    /**
     * opis pola
     */
    description?: string;
    /**
     * wartośc domyślna pola
     */
    default?: any;
    /**
     * liczba elementów w tablicy
     */
    length?: number;
    /**
     * precyzja pola number, domyslnie 8
     */
    precision?: number;
    /**
     * wynik funkcji walidującej
     */
    validFunc?: string;
    /**
     * wynik funkcji walidującej warning
     */
    warningValidFunc?: string;
    /**
     * czy pole jest wyłączone
     */
    disabled?: boolean;
    /**
     * ostrzeżenia
     */
    warnings?: IWrappedPropertySchemaValidators;
    /**
     * ustawienia csv
     */
    csv?: ISchemaCsv;
}
interface IWrappedProperty<ModelType = any, ExternalType = any, FormType = any> {
    /**
     * nazwa pola, dla elementów tablicy jego indeks w tablicy
     *
     * @type {(string | number)}
     * @memberof IWrappedProperty
     */
    readonly $key: string | number;
    /**
     * indeks w tablicy, gdy nie ma żadnej tablicy wyżej to -1
     */
    readonly $arrayIndex: number;
    /**
     * element nadrzędny do pola
     *
     * @type {(IWrappedProperty | null)}
     * @memberof IWrappedProperty
     */
    readonly $parent: IWrappedPropertyWithProps<any, ExternalType, FormType> | null;
    /**
     * element główny, odpowiadający poziomowi modelu
     *
     * @type {IWrappedProperty}
     * @memberof IWrappedProperty
     */
    readonly $root: IWrappedPropertyWithProps<any, ExternalType, FormType>;
    /**
     * wyliczona schema, w przypadku wyliczanych wartości tu znajdują sie już te po obliczeniach
     *
     * @type {*}
     * @memberof IWrappedProperty
     */
    readonly $schema: Readonly<IWrappedPropertySchema>;
    /**
     * pełna ścieżka do pola
     *
     * @type {string}
     * @memberof IWrappedProperty
     */
    readonly $path: string;
    /**
     * ściezka lang do pola
     *
     * @type {string}
     * @memberof IWrappedProperty
     */
    readonly $langPath: string;
    /**
     * wartość z modelu
     *
     * @type {*}
     * @memberof IWrappedProperty
     */
    $model: ModelType;
    /**
     * wartośc tekstowa dla pola prostego, w polach typu `array` czy `object`, to samo co w `$model`
     *
     * @type {*}
     * @memberof IWrappedProperty
     */
    $value: any;
    /**
     * poprzednia wartośc pola
     */
    readonly $prevModel: any | undefined;
    /**
     * wartośc tekstowa dla pola prostego, poprzedni model dla porównania w polach typu `array` czy `object`, to samo co w `$model`
     *
     * @type {*}
     * @memberof IWrappedProperty
     */
    $prevValue: any | undefined;
    /**
     * wartośc tekstowa dla pola prostego, poprzedni model dla porównania w polach typu `array` czy `object`, to samo co w `$model`
     *
     * @type {*}
     * @memberof IWrappedProperty
     */
    $diffStatus: '' | 'new' | 'del' | 'changed';
    /**
     * czy element był "dotykany"
     *
     * @type {boolean}
     * @memberof IWrappedProperty
     */
    $dirty: boolean;
    /**
     * czy na elemencie jest focus
     *
     * @type {boolean}
     * @memberof IWrappedProperty
     */
    $hasFocus: boolean;
    /**
     * ustawienie $hasFocus na true
     *
     * @param {FocusEvent} [event] żródłowe zdarzenie, używane do zapamietania elementu
     * @memberof WrappedPropertyBase
     */
    $focus(event?: Event): void;
    /**
     * ustawienie $hasFocus na false
     *
     * @param {FocusEvent} [event] żródłowe zdarzenie
     * @memberof WrappedPropertyBase
     */
    $blur(event?: Event): void;
    /**
     * podpięcie pod element HTML (input[text|checkbox|radio] lub textarea)
     * @param el element html lub selector
     */
    $bind(el: HTMLElement | string, modifiers?: any): MountItem | null;
    /**
     *
     * @param el html element lub obiekt zwrócony przez $bind
     */
    $unbind(el?: HTMLElement | MountItem): boolean;
    /**
     * obiekt danych użytkownika, można dodawać dowolne pola
     *
     * @type {*}
     * @memberof IWrappedProperty
     */
    readonly $data: Record<string, any>;
    /**
     * czy pole jest wyłaczone
     *
     * @type {boolean}
     * @memberof IWrappedProperty
     */
    readonly $disabled: boolean;
    /**
     * komunikat błędu, lub null
     *
     * @type {(string | null)}
     * @memberof IWrappedProperty
     */
    readonly $error: string | null;
    /**
     * lista ostrzeżeń
     *
     * @type {string[]}
     * @memberof IWrappedProperty
     */
    readonly $warnings: string[];
    /**
     * tytuł ze schematu lub pusty tekst
     *
     * @type {string}
     * @memberof IWrappedProperty
     */
    readonly $title: string;
    /**
     * skrócony tytuł ze schematu `shortTitle` gdy nie ma to `title`
     *
     * @type {string}
     * @memberof IWrappedProperty
     */
    readonly $shortTitle: string;
    /**
     * opis ze schematu `description` lub pusty tekst
     *
     * @type {string}
     * @memberof IWrappedProperty
     */
    readonly $description: string;
    /**
     * ustawienia csv
     *
     * @type {string}
     * @memberof IWrappedProperty
     */
    readonly $csv?: ISchemaCsv;
    /**
     * pobranie dopuszczalnych wartości pola, `enum` w schema
     * pusta tablica gdy brak definicji
     *
     * @readonly
     * @type {Array}
     * @memberof IWrappedProperty
     */
    readonly $enum: any[];
    /**
     * readOnly ze schematu `readOnly` lub ustawione przez użytkownika lub z root
     *
     * @type {boolean | undefined}
     * @memberof IWrappedProperty
     */
    $readOnly: boolean | undefined;
    /**
     * $parent.$parent
     *
     * @type {IWrappedProperty}
     * @memberof IWrappedProperty
     */
    $parent2: IWrappedProperty | null;
    /**
     * $parent.$parent.$parent
     *
     * @type {IWrappedProperty}
     * @memberof IWrappedProperty
     */
    $parent3: IWrappedProperty | null;
    /**
     * walidacja elementu, zwraza komunikat błędu lub null
     *
     * @returns {(string | boolean | null)}
     * @memberof IWrappedProperty
     */
    $validate(): string | boolean | null;
    /**
     * walidacja elementu, zwraza komunikat błędu lub null
     *
     * @param {*} [value] wartosc do sprawdzenia, przy jej braku (lub undefined) bierze wartośc z modelu
     * @param {boolean} [skipDirty] czy nie zaznaczać $dirty
     * @returns {(string | boolean | null)}
     * @memberof IWrappedProperty
     */
    $validate(value?: any, skipDirty?: boolean): string | boolean | null;
    /**
     * pełny wynik validacji po $validate
     *
     * @type {(IValidateResult | null)}
     * @memberof IWrappedProperty
     */
    readonly $validateResult: IValidateResult | null;
    /**
     * waliduje element i wszystkie podrzędne
     *
     * @returns {IWrappedProperty[]} wynikowa tablica elementów które nie przeszły walidacji
     * @memberof IWrappedProperty
     */
    $validateAll(): IWrappedProperty<any>[];
    /**
     * waliduje element i wszystkie podrzędne
     *
     * @param {boolean} skipDirty czy nie zaznaczać $dirty
     * @returns {IWrappedProperty[]} wynikowa tablica elementów które nie przeszły walidacji
     * @memberof IWrappedProperty
     */
    $validateAll(skipDirty?: boolean): IWrappedProperty<any>[];
    $validateAll(skipDirty?: boolean, result?: IWrappedProperty[]): IWrappedProperty<any>[];
    $hasValidators: boolean;
    /**
     * sprawdzanie ostrzeżeń
     *
     * @param {*} [value] wartość pola
     * @returns {string[]} wynikowa tablica ostrzeżeń
     * @memberof IWrappedProperty
     */
    $check(): string[];
    /**
     * sprawdzanie ostrzeżeń
     *
     * @param {*} [value] wartość pola
     * @param {boolean} [skipDirty] czy nie zaznaczać $dirty
     * @returns {string[]} wynikowa tablica ostrzeżeń
     * @memberof IWrappedProperty
     */
    $check(value?: any, skipDirty?: boolean): string[];
    $check(value?: any, skipDirty?: boolean, checkResult?: string[]): string[];
    /**
     * pełny wynik sprawdzania ostrzeżeń
     *
     * @type {IValidateResult[]}
     * @memberof IWrappedProperty
     */
    readonly $checkResult: IValidateResult[];
    /**
     * ostrzeżenie z tego pola i pól podrzędnych
     *
     * @param {boolean} [skipDirty] czy nie zaznaczać $dirty
     * @param {IWrappedProperty[]} [result] tablica ostrzeżeń (do użytku wewnętrznego)
     * @returns {IWrappedProperty[]}
     * @memberof IWrappedProperty
     */
    $checkAll(skipDirty?: boolean, result?: IWrappedProperty[]): IWrappedProperty[];
    /**
     * ustawienie domyślnej wartości w polu
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedProperty
     */
    $setDefault(): boolean;
    /**
     * ustawienie wartości w polu
     *
     * @param {ModelType} value nowa wartość
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedProperty
     */
    $setData(value: ModelType): boolean;
    /**
     * ustawienie wartości w polu
     *
     * @param {*} value nowa wartość
     * @param {boolean} [fixArraySize] czy wymuszac zmianę wielkości tablic
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedProperty
     */
    $setData(value: ModelType, path: undefined | null, fixArraySize?: boolean): boolean;
    /**
     * ustawienie wartości w polu
     *
     * @param {*} value nowa wartość
     * @param {string} [path] ścieżka, przydatna gdy chcemy ustawić wartośc podrzędną
     * @param {boolean} [fixArraySize] czy wymuszac zmianę wielkości tablic
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedProperty
     */
    $setData(value: any, path: string, fixArraySize?: boolean): boolean;
    /**
     * ustawienie nowej wartości w polu
     *
     * @param {*} value nowa wartość
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedPropertyObject
     */
    $setNewData(value: ModelType): boolean;
    /**
     * ustawia domyślne wartości
     */
    $setNewData(): boolean;
    /**
     * ustawienie nowej wartości w polu
     *
     * @param {*} value nowa wartość
     * @param {string} path ścieżka, przydatna gdy chcemy ustawić wartośc podrzędną
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedPropertyObject
     */
    $setNewData(value: any, path: string): boolean;
    /**
     * pobranie danych, omija pola `computed` i inne niezgodne ze schematem
     *
     * @param {boolean} [checkDataType] czy sprawdzać typy, jeśli true to nie zwraca pól z nieprawidłowymi wartościami
     * @returns {*} wyczyszczone dane modelu
     * @memberof IWrappedProperty
     */
    $getData(checkDataType?: boolean): ModelType;
    $getData(checkDataType?: boolean, path?: string): ModelType;
    /**
     * pobranie danych jako JSON
     *
     * @param checkDataType
     * @param path
     */
    $getDataJson(checkDataType?: boolean, path?: string): string;
    /**
     * pobranie danych z pominięciem wartości domyślnych dla typu
     * "" - dla string
     * 0 - dla typów numerycznych
     * false - dla boolean
     * [] - dla array
     * null - dla wszystkich
     * undefined - dla wszystkich
     */
    $clearDataDefaults(): ModelType;
    /**
     * pobiera listę wartości z nieprawidłowym typem
     */
    $getInvalidValues(): IInvalidValue[];
    $getInvalidValues(res: IInvalidValue[]): IInvalidValue[];
    /**
     * ustawia nieprawidłowe wartości w polach
     */
    $setInvalidValues(res: IInvalidValue[]): void;
    /**
     * pobranie dziecka na podstawie ścieżki
     * @param path ścieżka w fortmacie pole.tablica[0].property
     */
    $child(path: string): IWrappedProperty | undefined;
    $child(path: string, createArrayItems: boolean): IWrappedProperty | undefined;
    /**
     * ustawianie $dirty na false, czyszczenie błędów
     *
     * @memberof IWrappedProperty
     */
    $reset(): void;
    /**
     * lista elementów "dotkniętych", zawiera wszystkie elementy podrzędne, z pominięciem $disabled
     *
     * @param {IWrappedProperty[]} result
     * @returns {IWrappedProperty[]}
     * @memberof IWrappedProperty
     */
    $dirtyList(result: IWrappedProperty[]): IWrappedProperty[];
    /**
     * ustawienie $dirty na polach zależnych
     *
     * @param paths
     */
    $setDirtyChild(paths: string): number;
    $setDirtyChild(paths: string[]): number;
    /**
     * przechodzi przez element i wszystkie elementy poniże w hierarchi
     * @param cb
     * @param allProps czy zwracac wszystkie porpery a nie tylko te obudowane
     */
    $traverseFirst(predicate: (prop: IWrappedProperty) => boolean | undefined, allProps: boolean): IWrappedProperty | undefined;
    $traverseFirst(predicate: (prop: IWrappedProperty) => boolean | undefined): IWrappedProperty | undefined;
    /**
     * wymusza przelicznie wszystkich calc
     */
    $forceCalc(): Promise<boolean>;
    /**
     * czy jakiekolwiek pole ma `$error`
     */
    $anyError: boolean;
    /**
     * czy jakiekolwiek pole ma `$warning`
     */
    $anyWarning: boolean;
    /**
     * rejestruje zdarzenie
     * @param eventName
     * @param eventFunction
     */
    $on(eventName: PropertyEventType, eventFunction: PropertyEventDelegate): boolean;
    /**
     * wyrejestrowuje funkcje zdarzenia
     * @param eventName
     * @param eventFunction
     */
    $off(eventName: PropertyEventType, eventFunction: PropertyEventDelegate): boolean;
    /**
     * wyrejestrowuje wszystkie funkcje zdarzenia
     * @param eventName
     */
    $off(eventName: PropertyEventType): boolean;
    /**
     * wyrejestrowuje wszystkie zdarzenia
     * @param eventName
     */
    $off(): boolean;
    /**
     * usuwa ten wiersz jeśli jest częścią tablicy, jeśli to jest tablica to usuwa ostatni wiersz
     */
    $removeRow(): boolean;
    /**
     * usuwa wskazany wiersz w tablicy lub tablicy nadrzędnej
     * @param index
     */
    $removeRow(index: number): boolean;
    /**
     * czyści aktualny lub ostatni
     */
    $clearRow(): boolean;
    /**
     * czyści wskazany wiersz
     * @param index index wiersza
     */
    $clearRow(index: number): boolean;
    /**
     * przesuwa wiersz w górę
     */
    $moveUp(): boolean;
    /**
     * przesuwa waskazany wiersz w górę
     */
    $moveUp(index: number): boolean;
    /**
     * przesuwa wiersz w dół
     */
    $moveDown(): boolean;
    /**
     * przesuwa wskazany wiersz w dół
     */
    $moveDown(index: number): boolean;
    /**
     * zmiana języka
     * @param lang kod języka
     * @param skipi18 czy pomijąc zmianę języka w i18n (jeśli podłączony)
     */
    $changeLanguage(lang: string, skipi18?: boolean): boolean;
    /**
     * pola w obiekcie
     */
    $fields: Record<string, IWrappedPropertyWithProps<any, ExternalType, FormType>>;
    /**
     * niszczenie obiektu i zwalnianie zasobów
     *
     * @memberof IWrappedProperty
     */
    $destroy(): void;
    /**
     * dodatkowe dane formularza
     *
     * @memberof IWrappedProperty
     */
    readonly $form: FormType;
    /**
     * zewnętrzne dane
     *
     * @memberof IWrappedProperty
     */
    $external: ExternalType;
}
/**
 * rozszerzenie IWrappedProperty o obiekt o dowolnych kluczach typu IWrappedPropertyWithProps
 */
type IWrappedPropertyWithProps<T = any, ExternalType = any, FormType = any> = IWrappedProperty<T, ExternalType, FormType> & {
    [propName: string]: IWrappedPropertyWithProps<any, ExternalType, FormType>;
};
interface IWrappedPropertyArray<ItemType = any, ModelItemType = ItemType extends {
    $model: any;
} ? ItemType['$model'] : any, ExternalType = any, FormType = any> extends IWrappedProperty<ModelItemType[], ExternalType, FormType> {
    /**
     * elementy tablicy
     */
    readonly $items: Array<IWrapperPropertyArrayItem<ItemType, ModelItemType>>;
    $setLength(newLength: number): boolean;
    $addRow(): boolean;
    $addRow(nvalue: Partial<ModelItemType>): boolean;
    $addRow(nvalue: Partial<ModelItemType>, count: number): boolean;
    $exchangeRow(index1: number, index2: number): boolean;
    /**
     * sortuje wg pola
     * @param field nazwa pola
     * @param desc czy malejąco
     */
    $sort(): void;
    $sort(field: string): void;
    $sort(field: string, desc: boolean): void;
    /**
     * zwraca częśc tablicy wg filtra
     *
     * @param {(value: any, index: number, array: any[]) => boolean} func filtr
     * @returns {any[]} filtrowana tablica
     * @memberof IWrappedPropertyArray
     */
    $filter(func: (value: IWrapperPropertyArrayItem<ItemType, ModelItemType>, index: number, array: Array<IWrapperPropertyArrayItem<ItemType, ModelItemType>>[]) => boolean): Array<IWrapperPropertyArrayItem<ItemType, ModelItemType>>;
    /**
     * aktualny numer strony
     *
     * @type {number}
     * @memberof IWrappedPropertyArray
     */
    $pageNumber: number;
    /**
     * @deprecated używać `$pageNumber`
     * aktualny numer strony
     *
     * @type {number}
     * @memberof IWrappedPropertyArray
     */
    pageNumber: number;
    /**
     * aktualny rozmiar strony, domyślnie 25
     *
     * @type {number}
     * @memberof WrappedPropertyArray
     */
    $pageSize: number;
    /**
     * @deprecated używać $pageSize
     * aktualny rozmiar strony, domyślnie 25
     *
     * @type {number}
     * @memberof WrappedPropertyArray
     */
    pageSize: number;
    /**
     * liczba stron
     *
     * @readonly
     * @type {number}
     * @memberof WrappedPropertyArray
     */
    readonly $pageCount: number;
    /**
     * @deprecated używać `$pageCount`
     * liczba stron
     *
     * @readonly
     * @type {number}
     * @memberof WrappedPropertyArray
     */
    readonly pageCount: number;
    /**
     * sposób sortowania tablizy zwracanej przez $getItems, $getPage
     *
     * @type {string}
     * @memberof WrappedPropertyArray
     */
    $order: string;
    /**
     * @deprecated używać $order
     * sposób sortowania tablizy zwracanej przez $getItems, $getPage
     *
     * @type {string}
     * @memberof WrappedPropertyArray
     */
    order: string;
    /**
     * pobranie częsciowej tablicy
     *
     * @param {number} [start] indeks startowy elementu, domyślnie 0
     * @param {number} [count] ile elementów, domyślnie do końca tablicy
     */
    $getItems(start?: number, count?: number, order?: string): Array<ItemType>;
    /**
     * pobranie strony
     *
     * @param {number} page numer strony domyślnie pageNumber
     * @param {number} pageSize rozmiar strony domyślnie pageSize
     * @returns
     * @memberof WrappedPropertyArray
     */
    $getPage(page: number, pageSize: number): Array<ItemType>;
    $getPage(page: number): Array<ItemType>;
    $getPage(): Array<ItemType>;
    /**
     * tutuł pola będącego elementem tablicy
     * @param fieldName nazwa pola, dla tablic prostych można pominąć
     */
    $fieldTitle(fieldName?: keyof ModelItemType): string;
    $fieldTitle(func: (x: ModelItemType) => any): string;
    /**
     * tutuł pola będącego elementem tablicy
     * @param fieldName nazwa pola, dla tablic prostych można pominąć
     */
    $tableField(fieldName?: string): IWrappedProperty;
    $tableField(func: (x: ModelItemType) => any): IWrappedProperty;
    $tableField<T2>(func: (x: ModelItemType) => any, propFunc: (prop: IWrappedProperty) => T2): T2 | undefined;
    $tableField<T2>(fieldName: string, propFunc: (prop: IWrappedProperty) => T2): T2 | undefined;
}
interface IWrappedPropertyObject<ModelType = any, ExternalType = any, FormType = any, PartialModelType = DeepPartial<ModelType>, NonComputedModelType = ModelType> extends Omit<IWrappedProperty<ModelType, ExternalType, FormType>, '$setData' | '$getData' | '$setNewData'> {
    /**
     * ustawienie wartości w polu
     *
     * @param {*} value nowa wartość
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedPropertyObject
     */
    $setData<T extends PartialModelType>(value: T): boolean;
    /**
     * ustawienie wartości w polu
     *
     * @param {*} value nowa wartość
     * @param {string} path ścieżka, przydatna gdy chcemy ustawić wartośc podrzędną
     * @param {boolean} [fixArraySize] czy wymuszac zmianę wielkości tablic, domyślnie `false`
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedPropertyObject
     */
    $setData(value: PartialModelType, path: null | undefined, fixArraySize?: boolean): boolean;
    /**
     * ustawienie wartości w polu
     *
     * @param {*} value nowa wartość
     * @param {string} path ścieżka, przydatna gdy chcemy ustawić wartośc podrzędną
     * @param {boolean} [fixArraySize] czy wymuszac zmianę wielkości tablic, domyślnie `false`
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedPropertyObject
     */
    $setData(value: any, path: string, fixArraySize?: boolean): boolean;
    /**
     * ustawienie nowej wartości w polu
     *
     * @param {*} value nowa wartość
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedPropertyObject
     */
    $setNewData(value: PartialModelType): boolean;
    $setNewData(): boolean;
    /**
     * ustawienie nowej wartości w polu
     *
     * @param {*} value nowa wartość
     * @param {string} path ścieżka, przydatna gdy chcemy ustawić wartośc podrzędną
     * @returns {boolean} czy udało się ustawić nową wartość
     * @memberof IWrappedPropertyObject
     */
    $setNewData(value: any, path: string): boolean;
    /**
     * pobranie danych, omija pola `computed` i inne niezgodne ze schematem
     *
     * @param {boolean} [checkDataType] czy sprawdzać typy, jeśli true (domyslnie) to nie zwraca pól z nieprawidłowymi wartościami
     * @returns {NonComputedModelType} wyczyszczone dane modelu
     * @memberof IWrappedProperty
     */
    $getData(): NonComputedModelType;
    $getData(checkDataType: boolean): NonComputedModelType;
    $getData(checkDataType: boolean, path: string): NonComputedModelType;
    /**
     * Ustawienie nowej wartości external, gdy poprzedni external jest reactive to jest aktualizowany (Object.assign)
     * @param external nowa wartośc $external
     */
    $setExternal(external: any): void;
    /**
     * dodanie dodatkowego pola, typ modelu jednak się nie zmieni, wiec w typowaniu nie bedzie wystaępował
     *
     * @param key nazwa pola
     * @param propSchema schemat
     */
    $addProp<T extends object>(key: string, propSchema: T): FromSchemaProperty<T>;
    /**
     * odwiedzone pola
     */
    $visitedProps: IWrappedProperty[];
    /**
     * zaczyna rejestrację ooczytu właściwości $error dla pól
     */
    $startRegisterErrorProps(): boolean;
    /**
     * pobieranie listy zarejestrowanych właściwości których odczytywano $error
     */
    $getErrorProps(): Set<IWrappedProperty>;
    /**
     * kończy rejestrację odczytu własciwości $error dla pól
     * @returns zwraca zestaw zarejestrowanych właściwości
     */
    $stopRegisterErrorProps(): Set<IWrappedProperty<any, ExternalType, FormType>>;
}

/**
 * interfejs zawierający komunikaty walidacji i ostrzeżeń
 *
 */
interface IValidateMessages {
    /**
     * komunikaty walidacji
     */
    validationMessages?: IValidationMessages;
    /**
     * komunikaty warnings
     */
    warningMessages?: IValidationMessages;
}

type GuidFormat = 'N' | 'D' | 'B' | 'P';
/**
 * generuje guid w formacie xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * @param format N - bez kresek, B - z klamrami, P - z nawiasami
 */
declare function generateGuid(format?: GuidFormat): string;
/**
 * generuje skrócony guid 12 znaków
 */
declare function generateShortGuid(): string;

/**
 * typy formatowania
 */
type FormatType = `1` | `1.` | `1)` | `(1)` | `a` | `a.` | `a)` | `(a)` | `A` | `A.` | `A)` | `(A)` | `i` | `i.` | `i)` | `(i)` | `I` | `I.` | `I)` | `(I)` | `abc` | `abc)` | `abc.` | `§` | `§ 1` | `§ 1.`;
/**
 * Formatuje liczbe do tekstu wyswietlanego na liscie
 * @export
 * @param {number} value wartośc liczbowa
 * @param {string} [type='1.'] typ formatowania
 * @returns {string} sformatowany tekst
 */
declare function listNumberFormat(value: number, type?: FormatType): string;

/**
 * dostępne typy formatowania obejmujące dodatkowo, formatowanie zagnieżdzone
 */
type ExtendedFormatType = FormatType | `1.1` | `1.1.1` | `1.1.` | `1.1.1.`;
/**
 * Oblicza następny numer na liście
 *
 * @export
 * @param {number[]} levels lista ostatnich wartości na każdym poziomie zagnieżdzenia
 * @param {number} [level=0] poziom zagnieżdzenia, domyślnie 0
 * @param {string} [type] typ formatowania, domyslnie wyliczany na podstawieni poziomu zagnieżdzenia: 1. -> a) -> i.
 * @param {number} [value] ręczne ustawienie wartości, ma wpływ na dalszą numerację
 * @returns {string} zwraca sformatowy tekst odpowieadający kolejnej wartości
 */
declare function nextListNumber(levels: number[], level?: number, type?: ExtendedFormatType, value?: number): string;

/**
 * klasa reprezentująca różnicę czasu
 */
declare class TimeSpan {
    static diff(lateDate: string | Date, earlyDate: string | Date): TimeSpan;
    private ms;
    private earlyDate?;
    private lateDate?;
    constructor(ms: number, lateDate?: Date, earlyDate?: Date);
    /**
     * całkowita liczba milisekund
     */
    get totalMiliseconds(): number;
    /**
     * ilośc milisekund po odjęciu sekund, minut, godzin i dni
     */
    get miliseconds(): number;
    /**
     * całkowita liczba sekund = liczba milisekund /1000
     */
    get totalSeconds(): number;
    /**
     * liczba sekund po odjęciu minut, godzin i dni
     */
    get seconds(): number;
    /**
     * całkowita liczba minut
     */
    get totalMinutes(): number;
    /**
     * liczba minut po odjęciu godzin i dni
     */
    get minutes(): number;
    /**
     * całkowita liczba godzin
     */
    get totalHours(): number;
    /**
     * liczba godzn po odjęciu liczby dni
     */
    get hours(): number;
    /**
     * całkowita liczba dni
     */
    get totalDays(): number;
    /**
     * liczba dni, wartośc całkowita
     */
    get days(): number;
    /**
     * liczba miesięcy, wartośc całkowita
     */
    get months(): number;
    /**
     * liczba lat, wartość całkowita
     */
    get years(): number;
    /**
     * róznica w postaci HH:mm:ss
     */
    toString(): string;
}

interface ISchemaMethods {
    /**
     * Bieżący język
     */
    lang: ILang;
    defaultLang: {
        current: ILang;
        setLang(name: string): void;
    };
    /**
     * patterny do RegEx
     */
    patterns: Patterns;
    /**
     * Sprawdza czy tekst jest podanego formatu.
     * @param format format tekstu
     * @param value wartośc do weryfikacji
     */
    check(format: CheckFormatType, value: string): boolean;
    /**
     * Dodaje określoną liczbę jednostek do daty.
     * @param date data wejściowa
     * @param part częśc daty do zmiany y M d h m s
     * @param value o lie zwiększyć
     */
    dateAdd(date: string | Date, part: string, value: number): string;
    /**
     * Dodaje określoną liczbę jednostek do daty.
     * @param date data wejściowa
     * @param part częśc daty do zmiany
     * @param value o lie zwiększyć
     */
    dateSet(date: string | Date, part: string, value: number): string;
    /**
     * Oblicza różnicę pomiędzy datami.
     * @param lateDate data późniejsza
     * @param earlyDate data wcześniejsza
     */
    dateDiff(lateDate: string | Date, earlyDate: string | Date): TimeSpan;
    /**
     * Zwraca liczbę reprezetującą częśc daty.
     * @param date data w formacie yyyy-MM-dd HH:mm:ss
     * @param part rok:y,yy,yyy,year;
     * miesiąc:M,MM,month;
     * dzien:d,dd,day;
     * godzina:h,hh,hour;
     * minuta:m,mm,minute;
     * sekunda:s,ss,second;
     */
    datePart(date: string | Date, part: string): number;
    /**
     * Głębokie kopiowanie.
     * @param data date do skopiowania
     */
    deepCopy<T = any>(data: T): T;
    /**
     * Parsowanie tekstowego formatu daty do Date.
     * @param date data w formacie YYYY-MM-DD lub YYYY-MM-DD HH:mm:ss
     */
    dateParse(date: string): Date;
    /**
     * Zwraca nazwę świeta z wybranego dnia.
     * @param date
     * @returns
     */
    dateHoliday(date: string | Date): string;
    /**
     * Generuje guid w formacie xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx.
     * @param format N - bez kresek, B - z klamrami, P - z nawiasami
     */
    generateGuid(format?: GuidFormat): string;
    /**
     * generuje guid skrócony do 12 znaków
     */
    generateShortGuid(): string;
    /**
     * Obcina początkowe i końcowe spacje w tekscie.
     * @param text tekst do obcięcia
     */
    trim(text: string): string;
    /**
     * Zamienia pierwszą literę każdego wyrazu na wielką, pozostałe na małe.
     *
     * @param value wartośc do zmiany
     */
    capitalize(value: string): string;
    /**
     * Zamienia wszystkie wystąpienia stringu.
     * @param str
     * @param find
     * @param replace
     */
    replaceAll(str: string, find: string, replace: string): string;
    replaceAll(str: string, find: string, replacer: (substring: string, ...args: any[]) => string): string;
    /**
     * Formatuje liczbę zmiennoprzecinkową do polskiego formatu.
     * @param value liczba
     * @param precision do ilu miejsc po przecinku zaokrąglić, domyślnie 8
     */
    fnumber(value: number, precision: number): string;
    /**
     * Formatuje liczbę zmiennoprzecinkową do polskiego formatu.
     * @param value liczba
     * @param forcezeros czy zachować zera ,00
     * @param precision do ilu miejsc po przecinku zaokrąglić, domyślnie 2
     */
    fmoney(value: number): string;
    fmoney(value: number, forcezeros: boolean): string;
    fmoney(value: number, forcezeros: boolean, precision: number): string;
    /**
     * Formatuje liczbę zmiennoprzecinkową do polskiego formatu.
     * @param value liczba
     * @param forcezeros czy zachować zera ,00
     * @param precision do ilu miejsc po przecinku zaokrąglić, domyślnie 2
     */
    fmoneySpace(value: number | string): string;
    fmoneySpace(value: number | string, forcezeros: boolean): string;
    fmoneySpace(value: number | string, forcezeros: boolean, precision: number): string;
    /**
     * Formatuje datę i czas do formatu yyyy-MM-dd HH:mm:ss.
     * @param dt data typu Date
     */
    fdatetime(dt: Date | string): string;
    fdatetime(dt: Date | string, format: string): string;
    /**
     * Formatuje datę do formatu yyyy-MM-dd.
     * @param dt data typu Date
     */
    fdate(dt: Date): string;
    /**
     * Formatuje czas do formatu HH:mm:ss.
     * @param dt data typu Date
     */
    ftime(dt: Date): string;
    /**
     * Formatuje date do formatu wyświetlania.
     * @param dt data typu Date lub string
     * @param format? format daty lub domyślny z języka
     * @param lang? język
     */
    displayDate(dt: Date | string, format?: string, lang?: ILang): string;
    /**
     * Zamienia date wyświetlaną na fromat YYYY-MM-DD.
     * @param dt data wyswietlana
     * @param displayFormat format albo domyślny z języka
     * @param lang język
     */
    fromDisplayDate(dt: string, displayFormat?: string, lang?: ILang): string;
    /**
     * Zwraca tablicę zawierającą listę miesięcy pomiędzy datami.
     * @param startDate data początkowa
     * @param endDate data końcowa
     * @param format format, domyślnie `"MMMM yyyy"`, czyli `"styczeń 2019"`
     */
    listMonths(startDate: string, endDate: string, format?: string): string[];
    /**
     * Zwraca tablicę zawierającą listę lat pomiędzy datami.
     * @param startDate data początkowa
     * @param endDate data końcowa
     */
    listYears(startDate: string, endDate: string): number[];
    /**
     * Wyciąga datę urodzenia z pesel.
     * @param pesel
     */
    dateFromPesel(pesel: string): string;
    /**
     * Czy tablica `arr` zawiera wszystkie elementy z tablicy `requiredArr`.
     * @param arr tablica do sprawdzenia
     * @param requiredArr tablica elementów które są wyszukiwane
     */
    includesAll(arr: number[], requiredArr: number[]): boolean;
    /**
     * Zaokrągla liczbę zmiennoprzecinkową uwzględniając przekłamania JS.
     * @param value liczba
     * @param precision do ilu miejsc po przecinku zaokrąglić, domyślnie 2
     */
    mround(value: number): number;
    mround(value: number, precision: number): number;
    /**
     * Obliczanie wartości procentowej.
     * @param value wartość
     * @param totalValue wartośc odpowiadająca 100%
     */
    percent(value: number, totalValue: number): number;
    /**
     * Aktualna data i czas w formacie yyyy-MM-dd HH:mm:ss.
     */
    now(): string;
    /**
     * Sprawdza czy wartość jest null, jeśli tak to zwraca valueIfNull.
     * @param value wartość do sprawdzenia
     * @param valueIfNull co ma zwracać gdy value === null
     */
    nullDefault(value: any, valueIfNull: any): any;
    /**
     * Dodaje widoące zera do liczby.
     * @param value liczba
     * @param minLength minimalna, wynikowa długośc tekstu, domyslnie 2
     */
    padNumber(value: number): string;
    padNumber(value: number, minLength: number): string;
    /**
     * Dzisiejsza data w formacie yyyy-MM-dd.
     */
    today(): string;
    /**
     * Sumuje wartości w tablicy.
     * @param array tablica do sumowania
     * @param prop pole w wierszu podlegające sumowaniu, można pominąć
     */
    sum(array: any[]): any;
    sum<T>(array: T[], prop: keyof T): any;
    sum<T, K>(array: T[], func: (x: T, index: number) => K): K;
    sum(array: any, func: (x: any, index: number) => any): any;
    /**
     * Średnia wartośc z tablicy.
     * @param array tablica do sumowania
     * @param prop pole w wierszu podlegające sumowaniu, można pominąć
     */
    avg(array: any[]): number;
    avg<T>(array: T[], prop: keyof T): number;
    avg<T, K>(array: T[], func: (x: T, index: number) => K): K;
    avg(array: any, func: (x: any, index: number) => any): any;
    /**
     * Unikalne wartości z tablicy.
     * @param array tablica do sumowania
     * @param prop zwracane pole z wiersza tablicy
     */
    distinct(array: any[]): any[];
    distinct(array: any[], prop: string): any[];
    distinct<T>(array: T[], func: (x: T, index: number) => any): any[];
    distinct(array: any, func: (x: any, index: number) => any): any[];
    /**
     * Unikalne wiersze z tablicy.
     * @param array tablica do sumowania
     * @param prop pole do określenia unikalności wiersza
     */
    distinctItem(array: any[]): any[];
    distinctItem<T>(array: T[], prop: keyof T): T[];
    distinctItem<T>(array: T[], func: (x: T, index: number) => any): T[];
    distinctItem(array: any, func: (x: any, index: number) => any): any[];
    /**
     * Zwraca minimalną wartość z tablicy.
     * @param values tablica wartości
     * @param prop sprawdzane property
     */
    min(values: any[]): any;
    min<T>(values: T[], prop: keyof T): any;
    min<T, K>(array: T[], func: (x: T, index: number) => K): K;
    min(array: any, func: (x: any, index: number) => any): any;
    /**
     * Zwraca maksymalną wartość z tablicy.
     * @param values tablica wartości
     * @param prop sprawdzane property
     */
    max(values: any[]): any;
    max<T>(values: T[], prop: keyof T): any;
    max<T, K>(array: T[], func: (x: T, index: number) => K): K;
    max(array: any, func: (x: any, index: number) => any): any;
    /**
     * Zamiana liczby na słownie.
     *
     * @export
     * @param {number} value liczba do zamiany na słownie
     * @returns {string} liczba słownie
     */
    toWords(value: number): string;
    /**
     * Zamiana liczby na zapis rzymski, wielkimi literami.
     * 1-I, 2-II .... 10-X ...
     * @param value
     */
    bigRomanValue(value: number): string;
    /**
     * Zamiana liczy na zapis rzymski, małymi literami.
     * 1-i, 2-ii .... 10-x ...
     * @param value
     */
    smallRomanValue(value: number): string;
    /**
     * Zamiana kwoty na słownie ze słowem złoty/ch.
     * @param value kwota do zamiany
     * @param currency co wstawić jako walutę, domyslnie automatycznie dopasowuje odmianę `złoty`
     * @param forceShowgr czy wymusić grosze w przypadku gdy liczba groszy jest równa 0
     */
    toWordsMoney(value: number): string;
    toWordsMoney(value: number, currency: string): string;
    toWordsMoney(value: number, currency: string, forceShowgr: boolean): string;
    /**
     * Formatuje liczbe do tekstu wyświetlanego na liście.
     *
     * @export
     * @param {number} value wartośc liczbowa
     * @param {string} [type='1.'] typ formatowania
     * @returns {string} sformatowany tekst
     */
    listNumberFormat(value: number): string;
    listNumberFormat(value: number, type: FormatType): string;
    /**
     * Oblicza następny numer na liście.
     *
     * @export
     * @param {number[]} levels lista ostatnich wartości na każdym poziomie zagnieżdzenia
     * @param {number} [level=0] poziom zagnieżdzenia, domyślnie 0
     * @param {string} [type] typ formatowania, domyslnie wyliczany na podstawieni poziomu zagnieżdzenia: 1. -> a) -> i.
     * @param {number} [value] ręczne ustawienie wartości, ma wpływ na dalszą numerację
     * @returns {string} zwraca sformatowy tekst odpowieadający kolejnej wartości
     */
    nextListNumber(levels: number[], level: number, type?: ExtendedFormatType, value?: number): string;
    /**
     * Tłumaczy przy uzyciu i18n jesli jest dostarczone.
     * @param key klucz tlumaczenia
     * @param options opcje np. do replace
     * brak w vue2
     */
    translate(key: string, options?: any): string;
    /**
     * Synchronizuje tablice, usuwając elementy, które nie istnieją w sourceValues i dodając nowe elementy
     * @param destValues docelowa tablica
     * @param sourceValues źródłowa tablica
     * @param findFunc funkcja, która sprawdza czy elementy są takie same
     * @param mapFunc funkcja, która mapuje elementy z sourceValues na destValues
     * @returns true jeśli tablica została zmieniona
     */
    syncArray<DestinationType, SourceType>(destValues: DestinationType[], sourceValues: SourceType[], findFunc: (destItem: Partial<DestinationType>, sourceItem: SourceType) => boolean, mapFunc: (sourceItem: SourceType) => Partial<DestinationType>): boolean;
}

declare type ExPropType = Function;
declare type ExFunctionParamType<SchemaType, RootType = any, ExternalType = any, UserMethodsType = undefined> = {
    $root: SchemaType extends {
        $root: infer RootType2;
    } ? RootType2 & Record<string, any> : RootType extends undefined ? any : RootType;
    $parent: SchemaType extends {
        $parent: infer ParentType;
    } ? ParentType & Record<string, any> : any;
    $external: SchemaType extends {
        $external: infer ExternalType2;
    } ? ExternalType2 & Record<string, any> : ExternalType extends undefined ? any : ExternalType;
    $methods: SchemaType extends {
        $methods: infer UserMethodsType2;
    } ? ISchemaMethods & UserMethodsType2 & Record<string, any> : UserMethodsType extends undefined ? ISchemaMethods : ISchemaMethods & UserMethodsType;
    $obj: IWrappedProperty;
    $parent2: SchemaType extends {
        $parent2: infer Parent2Type;
    } ? Parent2Type & Record<string, any> : any;
    $parent3: SchemaType extends {
        $parent3: infer Parent3Type;
    } ? Parent3Type & Record<string, any> : any;
    $event: IPropertyEventData;
    $value: any;
    [key: string]: any;
};
interface JSONSchemaSimple<ExtendsPropType = ExPropType, ModelType = any> extends JSONSchema<ExtendsPropType, ModelType> {
    $ref?: undefined;
    allOf?: undefined;
    definitions?: undefined;
    properties?: Record<string, JSONSchemaSimple<ExtendsPropType>>;
    items?: JSONSchemaSimple<ExtendsPropType>;
}
/**
 * Sprawdza czy zmienna jest funkcją.
 * @param val
 * @returns
 */
declare const isFunction: (val: unknown) => val is Function;
/**
 * Sprawdza czy zmienna jest obiektem.
 * @param val
 * @returns
 */
declare const isObject: (val: unknown) => val is Record<any, any>;
/**
 * Kompiluje funkcje ale omija items i pojedyncze properties.
 * @param schema schemat
 * @returns
 */
declare function compileFunctions<T>(schema: T, options?: {
    removeDebugger?: boolean;
}): T;
/**
 * Definicja typu `this` dla `defineSchema`.
 */
type SchemaThis<SchemaType, RootType = any, ExternalType = any, UserMethodsType = undefined> = ThisType<FromSchemaSimple<SchemaType> & ExFunctionParamType<SchemaType, RootType, ExternalType, UserMethodsType>>;
declare function mergeSchema<SchemaType0, SchemaType1, AllTypes = MergeSchemaTypesSimple<SchemaType0, SchemaType1>>(schema0: SchemaType0, schema1: SchemaType1): AllTypes;
declare function mergeSchema<SchemaType0, SchemaType1, SchemaType2, AllTypes = MergeSchemaTypesSimple<SchemaType0, MergeSchemaTypesSimple<SchemaType1, SchemaType2>>>(schema0: SchemaType0, schema1: SchemaType1, schema2: SchemaType1): AllTypes;
declare function mergeSchema<SchemaType0, SchemaType1, SchemaType2, SchemaType3, AllTypes = MergeSchemaTypesSimple<SchemaType0, MergeSchemaTypesSimple<SchemaType1, MergeSchemaTypesSimple<SchemaType2, SchemaType3>>>>(schema0: SchemaType0, schema1: SchemaType1, schema2: SchemaType2, schema3: SchemaType3): AllTypes;
/**
 * Predefinicja schematu, umożliwia ustawienie typu $root, $external i $methods.
 * @param $root
 * @param $external
 * @param $methods
 * @returns
 */
declare function predefineSchema<RootType = any, ExternalType = any, MethodsType = undefined>($root?: RootType, $external?: ExternalType, $methods?: MethodsType): {
    <SchemaType extends JSONSchemaSimple>(schema0: SchemaType & SchemaThis<SchemaType, RootType, ExternalType, MethodsType>): SchemaType;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, SchemaType1>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, RootType, ExternalType, MethodsType>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, RootType, ExternalType, MethodsType>>): MergeSchemaTypes<SchemaType0, SchemaType1>;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, SchemaType2>>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, RootType, ExternalType, MethodsType>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, RootType, ExternalType, MethodsType>>, schema2: SchemaType2 & ThisType<TType & ExFunctionParamType<SchemaType2, RootType, ExternalType, MethodsType>>): MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, SchemaType2>>;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, SchemaType3 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, MergeSchemaTypes<SchemaType2, SchemaType3>>>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, RootType, ExternalType, MethodsType>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, RootType, ExternalType, MethodsType>>, schema2: SchemaType2 & ThisType<TType & ExFunctionParamType<SchemaType2, RootType, ExternalType, MethodsType>>, schema3: SchemaType3 & ThisType<TType & ExFunctionParamType<SchemaType3, RootType, ExternalType, MethodsType>>): MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, MergeSchemaTypes<SchemaType2, SchemaType3>>>;
};
/**
 * Definicja schematu bez typowania.
 */
declare const defineSchema: {
    <SchemaType extends JSONSchemaSimple>(schema0: SchemaType & SchemaThis<SchemaType, any, any, undefined>): SchemaType;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, SchemaType1>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, any, any, undefined>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, any, any, undefined>>): MergeSchemaTypes<SchemaType0, SchemaType1>;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, SchemaType2>>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, any, any, undefined>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, any, any, undefined>>, schema2: SchemaType2 & ThisType<TType & ExFunctionParamType<SchemaType2, any, any, undefined>>): MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, SchemaType2>>;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, SchemaType3 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, MergeSchemaTypes<SchemaType2, SchemaType3>>>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, any, any, undefined>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, any, any, undefined>>, schema2: SchemaType2 & ThisType<TType & ExFunctionParamType<SchemaType2, any, any, undefined>>, schema3: SchemaType3 & ThisType<TType & ExFunctionParamType<SchemaType3, any, any, undefined>>): MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, MergeSchemaTypes<SchemaType2, SchemaType3>>>;
};
/**
 * Predefinicja funkcji fix która zmienia schemat bez zmiany zwracanego typu.
 * @param $root
 * @param $external
 * @param $methods
 * @returns
 */
declare function prefixSchema<RootType = any, ExternalType = any, MethodsType = undefined>($root?: RootType, $external?: ExternalType, $methods?: MethodsType): {
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema1: SchemaType1 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>): SchemaType0;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema1: SchemaType1 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema2: SchemaType2 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>): SchemaType0;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, SchemaType3 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema1: SchemaType1 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema2: SchemaType2 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema3: SchemaType3 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>): SchemaType0;
};
/**
 * Funkcja zmieniająca schemat bez zmiany typu.
 */
declare const fixSchema: {
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, any, any, undefined>, schema1: SchemaType1 & SchemaThis<SchemaType0, any, any, undefined>): SchemaType0;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, any, any, undefined>, schema1: SchemaType1 & SchemaThis<SchemaType0, any, any, undefined>, schema2: SchemaType2 & SchemaThis<SchemaType0, any, any, undefined>): SchemaType0;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, SchemaType3 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, any, any, undefined>, schema1: SchemaType1 & SchemaThis<SchemaType0, any, any, undefined>, schema2: SchemaType2 & SchemaThis<SchemaType0, any, any, undefined>, schema3: SchemaType3 & SchemaThis<SchemaType0, any, any, undefined>): SchemaType0;
};
/**
 * Predefinicja schematu bez kompilacji funkcji, umożliwia ustawienie typu $root, $external i $methods.
 * @param $root
 * @param $external
 * @param $methods
 * @returns
 */
declare function predefineSchemaSimple<RootType = any, ExternalType = any, MethodsType = undefined>($root?: RootType, $external?: ExternalType, $methods?: MethodsType): {
    <SchemaType extends JSONSchemaSimple>(schema0: SchemaType & SchemaThis<SchemaType, RootType, ExternalType, MethodsType>): SchemaType;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, SchemaType1>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, RootType, ExternalType, MethodsType>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, RootType, ExternalType, MethodsType>>): MergeSchemaTypes<SchemaType0, SchemaType1>;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, SchemaType2>>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, RootType, ExternalType, MethodsType>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, RootType, ExternalType, MethodsType>>, schema2: SchemaType2 & ThisType<TType & ExFunctionParamType<SchemaType2, RootType, ExternalType, MethodsType>>): MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, SchemaType2>>;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, SchemaType3 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, MergeSchemaTypes<SchemaType2, SchemaType3>>>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, RootType, ExternalType, MethodsType>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, RootType, ExternalType, MethodsType>>, schema2: SchemaType2 & ThisType<TType & ExFunctionParamType<SchemaType2, RootType, ExternalType, MethodsType>>, schema3: SchemaType3 & ThisType<TType & ExFunctionParamType<SchemaType3, RootType, ExternalType, MethodsType>>): MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, MergeSchemaTypes<SchemaType2, SchemaType3>>>;
};
/**
 * Definicja schematu bez typowania i kompilacji funkcji.
 */
declare const defineSchemaSimple: {
    <SchemaType extends JSONSchemaSimple>(schema0: SchemaType & SchemaThis<SchemaType, any, any, undefined>): SchemaType;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, SchemaType1>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, any, any, undefined>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, any, any, undefined>>): MergeSchemaTypes<SchemaType0, SchemaType1>;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, SchemaType2>>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, any, any, undefined>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, any, any, undefined>>, schema2: SchemaType2 & ThisType<TType & ExFunctionParamType<SchemaType2, any, any, undefined>>): MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, SchemaType2>>;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, SchemaType3 extends JSONSchemaSimple, AllTypes = MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, MergeSchemaTypes<SchemaType2, SchemaType3>>>, TType = FromSchemaSimple<AllTypes>>(schema0: SchemaType0 & ThisType<TType & ExFunctionParamType<SchemaType0, any, any, undefined>>, schema1: SchemaType1 & ThisType<TType & ExFunctionParamType<SchemaType1, any, any, undefined>>, schema2: SchemaType2 & ThisType<TType & ExFunctionParamType<SchemaType2, any, any, undefined>>, schema3: SchemaType3 & ThisType<TType & ExFunctionParamType<SchemaType3, any, any, undefined>>): MergeSchemaTypes<SchemaType0, MergeSchemaTypes<SchemaType1, MergeSchemaTypes<SchemaType2, SchemaType3>>>;
};
/**
 * Predefinicja funkcji fix która zmienia schemat bez zmiany zwracanego typu i bez kompilacji funkcji.
 * @param $root
 * @param $external
 * @param $methods
 * @returns
 */
declare function prefixSchemaSimple<RootType = any, ExternalType = any, MethodsType = undefined>($root?: RootType, $external?: ExternalType, $methods?: MethodsType): {
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema1: SchemaType1 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>): SchemaType0;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema1: SchemaType1 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema2: SchemaType2 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>): SchemaType0;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, SchemaType3 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema1: SchemaType1 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema2: SchemaType2 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>, schema3: SchemaType3 & SchemaThis<SchemaType0, RootType, ExternalType, MethodsType>): SchemaType0;
};
/**
 * Funkcja zmieniająca schemat bez zmiany typu i kompilacji funkcji.
 */
declare const fixSchemaSimple: {
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, any, any, undefined>, schema1: SchemaType1 & SchemaThis<SchemaType0, any, any, undefined>): SchemaType0;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, any, any, undefined>, schema1: SchemaType1 & SchemaThis<SchemaType0, any, any, undefined>, schema2: SchemaType2 & SchemaThis<SchemaType0, any, any, undefined>): SchemaType0;
    <SchemaType0 extends JSONSchemaSimple, SchemaType1 extends JSONSchemaSimple, SchemaType2 extends JSONSchemaSimple, SchemaType3 extends JSONSchemaSimple>(schema0: SchemaType0 & SchemaThis<SchemaType0, any, any, undefined>, schema1: SchemaType1 & SchemaThis<SchemaType0, any, any, undefined>, schema2: SchemaType2 & SchemaThis<SchemaType0, any, any, undefined>, schema3: SchemaType3 & SchemaThis<SchemaType0, any, any, undefined>): SchemaType0;
};
/**
 * Zamienia schemat na tekst JS.
 * @param schemaDef definicja schematu
 * @param replaceMethodsEnums czy zamieniać enumy z $methods na ich wartości
 * @returns
 */
declare function schemaToJsText(schemaDef: JSONSchemaSimple, replaceMethodsEnums?: boolean, removeThis?: boolean): string;

interface CompareResultRow {
    path?: string;
    type?: string;
    diff?: string;
    value?: any[];
    schema?: JSONSchema;
}
declare class CompareResult {
    equal: boolean;
    diff: CompareResultRow[];
    constructor();
}

/**
 * element listy elementów schematu
 *
 * @interface FlatPropsListItem
 */
interface FlatPropsListItem {
    /**
     * pełna ścieżka do pola
     *
     * @type {string}
     * @memberof FlatPropsListItem
     */
    path: string;
    /**
     * nazwa pola
     *
     * @type {string}
     * @memberof FlatPropsListItem
     */
    field: string;
    /**
     * schemat odpowiadający polu
     *
     * @type {JSONSchema}
     * @memberof FlatPropsListItem
     */
    schema: JSONSchema;
}
/**
 * zwraca płaską listę elementów schematu
 *
 * @export
 * @param {JSONSchema} schema schemat
 * @param {boolean} [sipleTypesOnly=false] czy zwracać tylko typy proste (pomija object i array)
 * @param {FlatPropsListItem[]} [prevList=[]] dane wewnętrzne
 * @returns {FlatPropsListItem[]} lista zwróconych właściwości
 */
declare function flatPropsList(schema: JSONSchema, sipleTypesOnly?: boolean, prevList?: FlatPropsListItem[]): FlatPropsListItem[];

type GDPRMode = '***' | 'a**b' | 'undefined';
/**
 * Anonimizuje dane wrażliwe, oznacozne jako GDPR
 * @param schema schemat
 * @param data dane
 * @param gdprMode tryb anonimizacji
 * @returns
 */
declare function gdprData(schema: JSONSchema, data: any, gdprMode?: GDPRMode): any;

/**
 * interfejs zawierający opcje walidacji
 *
 * @export
 * @interface IValidateOptions
 */
interface IValidateOptions extends IValidateMessages {
    /**
     * czy walidować kalkulacje
     */
    validateCalculations?: boolean;
    /**
     * dane zewnętrzne
     */
    external?: any;
    /**
     * funkcje schematu
     */
    schemaMethods?: any;
    /**
     * czy dodawać komunikaty walidacji
     */
    disableMessages?: boolean;
    /**
     * czy przerywać po pierwszym błędzie
     *
     * @type {boolean}
     * @memberof IValidateOptions
     */
    breakOnFirstError?: boolean;
}

interface IValidationError {
    validation: string;
    expected?: any;
    message?: any;
    value?: any;
    path?: string;
}
declare class ValidationResult {
    valid: boolean;
    errors: IValidationError[];
    constructor();
}

declare class JSchema {
    schema: JSONSchema;
    constructor(schema?: string | object | string[] | object[]);
    /**
     * ładowanie schema
     *
     * @param {(string | JSONSchema | (string | JSONSchema)[])} schema schemat lub tablica schematów
     * @memberof JSchema
     */
    init(schema: string | JSONSchema | (string | JSONSchema)[]): void;
    /**
     * Domyślna wartośc na podstawie pól default ze schematu
     * @param schemaPath Ściezka schematu dla ktorej zwrocic domyslan wartosc, gdy pominieta zwraca dla pelnego schematu
     */
    /**
     * Domyślna wartośc na podstawie pól default ze schematu
     *
     * @param {boolean} [force] mimo braku ustawienia default ustawia domyślne wartości w zależności od typu
     * @param {string} [schemaPath] ścieżka schematu
     * @returns {*}
     * @memberof JSchema
     */
    defaultValue(force?: boolean, schemaPath?: string, longGuids?: boolean): any;
    /**
     * Zwraca wartosc pola danych wg sciezki
     *
     * @param {*} data Pelne dane
     * @param {string} path sciezka w formacie pole.tablica[0].pole2
     * @returns {*} dane zgodne ze schematem
     * @memberof JSchema
     */
    dataValue(data: any, path: string): any;
    /**
     * Zwraca czesc schematu na podstawie sciezki
     * @param path sciezka w formacie pole.tablica[0].pole2
     */
    schemaValue(path: string): JSONSchema | null;
    /**
     * Sprawdza poprawnoc danych według schematu i zawartej w nim walidacji
     * @param data dane do sprawdzenia
     * @param schema gałąź schamtu, gdy pominięto to uzywa glownej
     * @param path sciezka schamtu, gdy pusta uzywa glownej
     */
    validate(data: any, options?: IValidateOptions, schema?: any, path?: string): ValidationResult;
    /**
     * Porównuje dane uzywając schematu, zwraca CompareResult zawierający wynik porównania i listę róźnic
     * @param firstItem pierwszy element do porównania
     * @param secondItem drugi element do porównania
     */
    compareData(firstItem: any, secondItem: any, compareArraySize?: boolean): CompareResult;
    /**
     * Czyści dane pozostawiając tylko te zgodne ze schematem
     *
     * @param {*} data dane do wyczyszczenia
     * @param {boolean} [checkDataType] czy sprawdzac poprawnośc typów danych prostych
     * (number,integer,boolean, string), domyślnie nie
     * @returns {*} wyczyszczone dane
     * @memberof JSchema
     */
    clearData(data: any, checkDataType?: boolean): any;
    /**
     * Anonimizuje dane wrażliwe, oznacozne jako GDPR
     * @param data dane
     * @param gdprMode trym anonimizacji
     * @returns
     */
    gdprData(data: any, gdprMode?: GDPRMode): any;
    /**
     * ustawienie danych zgodnie ze schematem
     *
     * @param {*} data obiekt reprezentujący dane docelowe
     * @param {*} value dane do zapisu
     * @param {string} path ścieżka
     * @param {*} [Vue] konstruktor Vue
     * @returns {boolean} czy udało się ustawić
     * @memberof JSchema
     */
    setData(data: any, value: any, path: string, fixArraySize?: boolean): boolean;
    /**
     * Naprawia formaty danych typu date i date-time oraz string
     *
     * @param {*} data dane
     * @param {*} [Vue] konstruktor Vue
     * @returns {number} ile pól naprawino
     * @memberof JSchema
     */
    fixDateFormat(data: any): number;
    fixFormat(data: any): number;
    /**
     * Naprawia obiekt dodając wszystkei brakujące poja
     * @param data obiekt danych
     * @param force mimo braku wartości domyslych ustwaia wartości w polach prostych
     * @returns liczba naprawionych pól
     */
    fixData(data: any, force?: boolean): number;
    /**
     * zwraca płaską listę elementów schematu
     *
     * @param {boolean} [simpleTypesOnly=false] zy zwracać tylko typy proste (pomija object i array)
     * @returns {FlatPropsListItem[]} lista zwróconych właściwości
     * @memberof JSchema
     */
    flatPropsList(simpleTypesOnly?: boolean): FlatPropsListItem[];
}

interface FixSchemaOptions {
    arrayItemGuidField?: string | null;
    model?: any;
    minified?: boolean;
}
declare function fixMinifiedSchema(schema: any): any;
declare function minifySchema(schema: any): any;
/**
 * Naprawia i łączy schematy
 * @param schemas schematy werjściowe
 * @param options opcje
 * @param parent element nadrzędny
 * @param root element root
 * @param mykey nazwa pola
 * @param fixType czy ma naprawiać typ pola jeśli brakuje
 */
declare function fixAndMergeSchema(schemas: JSONSchema[], options?: FixSchemaOptions, parent?: any, root?: any, mykey?: string | null, fixType?: boolean): JSONSchema;

declare const WrappedPropertyCtor: Record<string, new (props: {
    dest: IWrappedProperty | null;
    parent: any;
    prevModel?: any;
    propName: string | number;
    schema: JSONSchema;
    options: IOptions;
}) => IWrappedProperty>;

type SchemaOptionsType = JSONSchema<Function>;
declare class BaseSchemaClass<ExternalType = any, RootType = any, ParentType = any, ExtendMethodsType = never> {
    /**
     * metody schematu
     */
    protected $methods: ISchemaMethods | ExtendMethodsType;
    /**
     * objekt obudowujący właściwość
     */
    protected $obj: IWrappedPropertyWithProps;
    /**
     * nadrzędny
     */
    protected $parent: ParentType;
    /**
     * nadrzędny
     */
    protected $parent2: any;
    /**
     * nadrzędny
     */
    protected $parent3: any;
    /**
     * dane zewnętrzne
     */
    protected $external: ExternalType;
    /**
     * root modelu
     */
    protected $root: Omit<RootType, '$root' | '$methods' | '$external' | '$obj' | '$parent' | '$parent2' | '$parent3'>;
    /**
     * wartośc bieżącego pola, używana w validFunc()
     */
    protected $value: any;
}
/**
 * zamiana definicji klasy na schemat
 *
 * @export
 * @param {*} schemaClass klasa
 * @param {boolean} [useDefinitions=false] czyywać definicji (nie używane)
 * @returns {*}
 */
declare function classToSchema(schemaClass: any, defaultsFromInstance?: boolean): any;
/**
 * definicja tablicy
 *
 * @export
 * @param {(string | any)} [itemType] typ elementu w tablicy
 * @param {JSONSchema} [options={}] pozostałe opcje tablicy
 * @returns
 */
declare function SchemaArray(itemType?: string | any, options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole z wartościami numerycznymi, zaokrąglonymi do 8 miejsc po przecinku
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaNumber(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole z wartościami wlutowymi, zaokrąglonymi do 2 miejsc po przecinku
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaMoney(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole z wartościami wlutowymi, zaokrąglonymi do 2 miejsc po przecinku
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaInteger(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole z wartościami tekstowymi
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaString(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole wymagane
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaRequired(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole z wartościami wlutowymi, zaokrąglonymi do 2 miejsc po przecinku
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaBoolean(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * ustawienie tytułu
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaTitle(title: string): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole akstowe o określonym formacie
 * @param format format
 * @param options dodatkowe opcje
 * @returns
 */
declare function SchemaFormat(format: JSONSchemaFieldFormat, options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole z wartościami wlutowymi, zaokrąglonymi do 2 miejsc po przecinku
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaGuid(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole z wartościami data typu string
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaDate(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole z wartościami data+czas typu string
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaDateTime(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * pole z wartościami nip typu string
 *
 * @export
 * @param {JSONSchema} [options={}] dodatkowe opcje
 * @returns
 */
declare function SchemaNip(options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 *
 * @param objectType typ obiektu, string albo typ
 * @param options
 * @returns
 */
declare function SchemaObject(objectType: any, options?: SchemaOptionsType): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
declare function SchemaAggregate(opt: ISchemaAggregate): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
/**
 * ustawienie opcji na całą definicję klasy
 *
 * @export
 * @param {JSONSchema} [options={}] opcje
 * @returns
 */
declare function SchemaClass(options?: SchemaOptionsType): (constructor: any) => any;
/**
 * ustawienie opcji na całą definicję klasy
 *
 * @export
 * @param {JSONSchema} [options={}] opcje
 * @returns
 */
declare function SchemaOptions(options?: any): (constructor: any) => any;
type ValidType = 'length' | 'required' | 'minimum' | 'maximum' | 'exclusiveMaximum' | 'exclusiveMinimum' | 'multipleOf' | 'maxLength' | 'minLength' | 'maxItems' | 'minItems' | 'pattern' | 'format' | 'enum';
declare function SchemaValidation(fieldOrFields?: string | string[] | null, typeOrTypes?: ValidType | ValidType[] | null): (target: any, propertyKey: string | symbol, descriptor?: PropertyDescriptor) => void;
declare const JProp: {
    Number: typeof SchemaNumber;
    Integer: typeof SchemaInteger;
    Money: typeof SchemaMoney;
    String: typeof SchemaString;
    Format: typeof SchemaFormat;
    Date: typeof SchemaDate;
    DateTime: typeof SchemaDateTime;
    Nip: typeof SchemaNip;
    Guid: typeof SchemaGuid;
    Boolean: typeof SchemaBoolean;
    Array: typeof SchemaArray;
    Object: typeof SchemaObject;
    Required: typeof SchemaRequired;
    Title: typeof SchemaTitle;
    Valid: typeof SchemaValidation;
    Aggregate: typeof SchemaAggregate;
};
declare const $methods: ISchemaMethods;

/**
 * Sprawdza poprawnoc danych według schematu i zawartej w nim walidacji
 * @param data dane do sprawdzenia
 * @param schema gałąź schamtu, gdy pominięto to uzywa glownej
 * @param path sciezka startowa pola, przy pominięciu ustawia pustą
 */
/**
 * Sprawdza poprawność danych według schematu i zawartej w nim walidacji
 *
 * @export
 * @param {JSONSchema} schema schemat danych
 * @param {*} data dane do sprawdzenia
 * @param {IValidateOptions} [options] opcje walidacji
 * @param {string} [path=''] aktualna ścieżka, używana potem w wynikach jako ścieżka bazowa
 * @returns {ValidationResult} wynik walidacji
 */
declare function validate(schema: JSONSchema, data: any, options?: IValidateOptions, path?: string): ValidationResult;

/**
 * liczba przez referencje
 */
declare const schemaMixin: {
    created(): void;
    methods: {
        $setSchema(schema?: JSONSchema | JSONSchema[], forceUpdate?: boolean): IWrappedProperty | undefined;
    };
};

declare const schemaDirective: Directive;

interface IWrapOptions<ExternalType = any, FormType = any, PrevModelType = any> extends IOptions<ExternalType, FormType, PrevModelType> {
    arrayItemGuidField?: string;
    skipFix?: boolean;
    vm?: any;
    gdprMode?: GDPRMode;
    onBeforeFixSchema?(schema: JSONSchema | JSONSchema[], fixOptions: FixSchemaOptions): any;
    onBeforeWrap?(model: any, schema: JSONSchema, options: IOptions): any;
    onAfterSchema?(wrapped: IWrappedProperty): any;
}
interface IWrapClassOptions<ExternalType = any, FormType = any, PrevModelType = any> extends IWrapOptions<ExternalType, FormType, PrevModelType> {
    defaultsFromInstance?: boolean;
}
declare function wrapSchemaSimple<SchemaType extends JSONSchemaSimple<any>, ExternalType = any, FormType = any>(schema: SchemaType): FromSchemaPropertySimple<SchemaType, ExternalType, FormType>;
declare function wrapSchemaSimple<SchemaType extends JSONSchemaSimple<any>, ExternalType = any, FormType = any, ModelType = PartialFromSchemaSimple<SchemaType>>(schema: SchemaType, model: ModelType | null): FromSchemaPropertySimple<SchemaType, ExternalType, FormType>;
declare function wrapSchemaSimple<SchemaType extends JSONSchemaSimple<any>, ExternalType = any, FormType = any, ModelType = PartialFromSchemaSimple<SchemaType>>(schema: SchemaType, model: ModelType | null, options: Partial<IWrapOptions<ExternalType, FormType, ModelType | null>>): FromSchemaPropertySimple<SchemaType, ExternalType, FormType>;
declare function wrapSchemaClass<T = any, ExternalType = any, FormType = any>(schemaClass: new () => T, model?: Partial<T> | null, options?: Partial<IWrapClassOptions<ExternalType, FormType, Partial<T>>>): SchemaInterface<T, ExternalType, FormType>;
declare function wrapSchema<T extends Record<string, any>, ExternalType = any, FormType = any, ModelType = PartialFromSchema<T>>(schema: T, model?: ModelType | null, options?: Partial<IWrapOptions<ExternalType, FormType, ModelType | null>>): FromSchemaProperty<T, ExternalType, FormType>;

declare function usePagination<ItemType, ModelItemType>(arr: IWrappedPropertyArray<ItemType, ModelItemType>, pageSize?: number): {
    gotoItem: (itemIndex: number) => void;
    addRow: (data?: Partial<ModelItemType>) => boolean;
    removeRow: (index: number) => void;
    moveUp: (index: number) => true | undefined;
    moveDown: (index: number) => true | undefined;
    /**
     * liczba elmentów na stronie
     */
    pageSize: vue.Ref<number, number>;
    pageNumber: vue.WritableComputedRef<number, number>;
    pageCount: vue.ComputedRef<number>;
    items: vue.ComputedRef<ItemType[]>;
    order: ["" | keyof ModelItemType | keyof { [K in string & keyof ModelItemType as `${K} desc`]: true; }] extends [vue.Ref<any, any>] ? _vue_shared.IfAny<vue.Ref<any, any> & ("" | keyof ModelItemType | keyof { [K in string & keyof ModelItemType as `${K} desc`]: true; }), vue.Ref<vue.Ref<any, any> & ("" | keyof ModelItemType | keyof { [K in string & keyof ModelItemType as `${K} desc`]: true; }), vue.Ref<any, any> & ("" | keyof ModelItemType | keyof { [K in string & keyof ModelItemType as `${K} desc`]: true; })>, vue.Ref<any, any> & ("" | keyof ModelItemType | keyof { [K in string & keyof ModelItemType as `${K} desc`]: true; })> : vue.Ref<"" | vue.UnwrapRef<keyof ModelItemType> | vue.UnwrapRef<keyof { [K in string & keyof ModelItemType as `${K} desc`]: true; }>, "" | keyof ModelItemType | keyof { [K in string & keyof ModelItemType as `${K} desc`]: true; } | vue.UnwrapRef<keyof ModelItemType> | vue.UnwrapRef<keyof { [K in string & keyof ModelItemType as `${K} desc`]: true; }>>;
};

declare function isWrappedProperty(obj: any): any;

/**
 * przegląda drzewo komponentów Vue w poszukiwaniu tych które pracująna IWrappedProperty
 * @param rootElementOrComponent root komponent
 * @param cb callback zwracjący element, gdy callback zwróci false to proces jest przerywany
 * @param propName nazwa property, domyślnie "model"
 * @returns
 */
declare function traverseWrappedProperties(cmp: any, cb: (prop: IWrappedProperty, cmp: any) => boolean | void, propName?: string): boolean | undefined;
/**
 *
 * @param cmp
 * @param cb
 * @param propName
 */
declare function traverseWrappedPropertiesDistinct(cmp: any, cb: (prop: IWrappedProperty, cmp: any) => boolean | void, propName?: string): void;
/**
 * Pobiera listę property które są atrybutem komponentów we wskazanej gałęzi html
 * @param cmp element html
 * @param propName własciwośc komponentu w którym przekazywany jest schemat, domyślnie "model"
 * @returns
 */
declare function getWrappedProperties(cmp: any, propName?: string): Set<IWrappedProperty>;
/**
 *
 * @param cmp komponent bazowy
 * @param propName
 * @returns
 */
declare function validateTree(cmp: any, propName?: string): any[];

/**
 * ustawienie danych zgodnie ze schematem
 *
 * @export
 * @param {JSONSchema} schema schemat
 * @param {*} data obiekt reprezentujący dane docelowe
 * @param {*} value dane do zapisu
 * @param {(string | string[])} [path] ścieżka
 * @param {number} [pathIndex=0] indeks na ścieżce (dane wewnętrzne)
 * @param {*} [Vue] konktruktor Vue
 * @param {boolean} [fixArraySize] czy ustawiać nowy rozmiar tablicyw  przypadku tablic
 * @returns {boolean} czy udało się ustawić
 */
declare function setData(schema: JSONSchema, data: any, value: any, path?: string | string[] | null, pathIndex?: number, fixArraySize?: boolean, options?: IOptions, currentPath?: string): boolean;

/**
 * zwraca wyczyszczone dane, tylko te które są zgodne ze schematem
 *
 * @export
 * @param {JSONSchema} schema schemat
 * @param {*} data dane wejściowe
 * @param {boolean} [checkDataType] czy sprawdzac poprawnośc typów danych prostych
 * (number,integer,boolean, string), domyślnie nie
 * @param {IOptions} [options] opcje, zawierające np. informacje o wyłączonych polach
 * @param {string} [currentPath=''] bieżąca ścieżka
 * @returns {*} wyczyszczone dane
 */
declare function clearData(schema: JSONSchema, data: any, checkDataType?: boolean, options?: IOptions, currentPath?: string): any;

declare function defineMethods<T extends object>(extraMethods: T & ThisType<ISchemaMethods & T>): T & ThisType<ISchemaMethods & T>;

/**
 * Naprawia formaty danych typu date i date-time
 *
 * @export
 * @param {JSONSchema} schema schemat
 * @param {*} data dane
 * @param {*} [Vue] konstruktor Vue
 * @returns {number} ile pól naprawino
 */
declare function fixDateFormat(schema: JSONSchema, data: any): number;

/**
 * Naprawia dane, ustawiając domyślne wartości w polach
 *
 * @export
 * @param {JSONSchema} schema
 * @param {*} data
 * @param force mimo braku wartości domyslych ustwaia wartości w polach prostych
 * @returns {number} zwraca liczbę naprawionych pól
 */
declare function fixData(schema: JSONSchema, data: any, force?: boolean, options?: IOptions, currentPath?: string): number;

declare const includes: (searchElement: any, fromIndex?: number) => boolean;
declare const keys: {
    (o: object): string[];
    (o: {}): string[];
};
declare const test: any;

declare const polyfills_includes: typeof includes;
declare const polyfills_keys: typeof keys;
declare const polyfills_test: typeof test;
declare namespace polyfills {
  export { polyfills_includes as includes, polyfills_keys as keys, polyfills_test as test };
}

/**
 * Sprawdza czy tekst jest podanego formatu
 * @param format format tekstu
 * @param value wartośc do weryfikacji
 */
declare function check(format: CheckFormatType, value: string): boolean;

type DatePart = 'y' | 'yy' | 'yyyy' | 'year' | 'M' | 'MM' | 'month' | 'd' | 'dd' | 'day' | 'h' | 'hh' | 'hour' | 'm' | 'mm' | 'minute' | 's' | 'ss' | 'second';
/**
 * zwraca liczbę reprezetującą częśc daty
 * @param date data w formacie yyyy-MM-dd HH:mm:ss
 * @param part rok:y,yy,yyy,year;
 * miesiąc:M,MM,month;
 * dzien:d,dd,day;
 * godzina:h,hh,hour;
 * minuta:m,mm,minute;
 * sekunda:s,ss,second;
 */
declare function datePart(date: string | Date, part: DatePart): number;

/**
 * dodaje określoną liczbę jednostek do daty
 * @param date data wejściowa
 * @param part częśc daty do zmiany y M d h m s
 * @param value o lie zwiększyć
 */
declare function dateAdd(date: string | Date, part: DatePart, value: number): string;

/**
 * dodaje określoną liczbę jednostek do daty
 * @param date data wejściowa
 * @param part częśc daty do zmiany
 * @param value o lie zwiększyć
 */
declare function dateSet(date: string | Date, part: DatePart, value: number): string;

/**
 * Oblicza różnicę pomiędzy datami
 * @param lateDate data późniejsza
 * @param earlyDate data wcześniejsza
 */
declare function dateDiff(lateDate: string | Date, earlyDate: string | Date): TimeSpan;

/**
 * Głębokie kopiowanie
 * @param data date do skopiowania
 */
declare function deepCopy(data: any): any;

/**
 * Parsowanie tekstowego formatu daty do Date
 * @param date data w formacie YYYY-MM-DD lub YYYY-MM-DD HH:mm:ss
 */
declare function dateParse(date: string): Date;

/**
 * zwraca nazwę świeta z wybranego dnia
 * @param date
 * @returns
 */
declare function dateHoliday(date: string | Date): string;

/**
 * Obcina początkowe i końcowe spacje w tekscie
 * @param text tekst do obcięcia
 */
declare function trim(text: string): string;

/**
 * zamienia pierwszą literę każdego wyrazu na wielką, pozostałe na małe
 *
 * @param value wartośc do zmiany
 */
declare function capitalize(value: string): string;

/**
 * formatuje liczbę zmiennoprzecinkową do polskiego formatu
 * @param value liczba
 * @param precision do ilu miejsc po przecinku zaokrąglić, domyślnie 8
 */
declare function fnumber(this: any, value: number, precision?: number, lang?: ILang): string;

/**
 * formatuje liczbę zmiennoprzecinkową do polskiego formatu
 * @param value liczba
 * @param forcezeros czy zachować zera ,00
 * @param precision do ilu miejsc po przecinku zaokrąglić, domyślnie 2
 */
declare function fmoney(this: any, value: number, forcezeros?: boolean, precision?: number, lang?: ILang): string;

/**
 * formatuje liczbę zmiennoprzecinkową do polskiego formatu
 * @param value liczba
 * @param forcezeros czy zachować zera ,00
 * @param precision do ilu miejsc po przecinku zaokrąglić, domyślnie 2
 */
declare function fmoneySpace(this: any, value: number | string, forcezeros?: boolean, precision?: number, lang?: ILang): string;

/**
 * formatuje datę i czas do formatu yyyy-MM-dd HH:mm:ss
 * @param dt data typu Date
 */
declare function fdatetime(this: any, dt: Date | string, format?: string, lang?: ILang): string;

/**
 * Formatuje date do formatu wyświetlania.
 * @param dt data typu Date lub string
 * @param format? format daty lub domyślny z języka
 * @param lang? język
 */
declare function displayDate(this: any, dt: Date | string, format?: string, lang?: ILang): string;
/**
 * Zamienia date wyświetlaną na format YYYY-MM-DD.
 * @param dt data wyswietlana
 * @param displayFormat format albo domyślny z języka
 * @param lang język
 */
declare function fromDisplayDate(this: any, dt: string, displayFormat?: string, lang?: ILang): string;

/**
 * formatuje datę do formatu yyyy-MM-dd
 * @param dt data typu Date
 */
declare function fdate(dt: Date): string;

/**
 * formatuje czas do formatu HH:mm:ss
 * @param dt data typu Date
 */
declare function ftime(dt: Date): string;

/**
 * Zwraca tablicę zawierającą listę miesięcy pomiędzy datami
 * @param startDate data początkowa
 * @param endDate data końcowa
 * @param format format, domyślnie MMMM yyyy, czyli "styczeń 2019"
 */
declare function listMonths(this: ISchemaMethods, startDate: string | Date, endDate: string | Date, format?: string): string[];

/**
 * Zwraca tablicę zawierającą listę lat pomiędzy datami
 * @param startDate data początkowa
 * @param endDate data końcowa
 */
declare function listYears(startDate: string, endDate: string): number[];

declare function dateFromPesel(pesel: string): string;

/**
 * Sprawdza czy tablica zawiera wszystkie elementy z tablicy requiredArr
 * @param arr
 * @param requiredArr
 * @returns
 */
declare function includesAll(arr: number[], requiredArr: number[]): boolean;

/**
 * zaokrągla liczbę zmiennoprzecinkową uwzględniając przekłamania JS
 * @param value liczba
 * @param precision do ilu miejsc po przecinku zaokrąglić, domyślnie 2
 */
declare function mround(value: number, precision?: number): number;

/**
 * obliczanie wartości procentowej
 * @param value wartość
 * @param totalValue wartośc odpowiadająca 100%
 */
declare function percent(value: number, totalValue: number): number;

/**
 * aktualna data i czas w formacie yyyy-MM-dd HH:mm:ss
 */
declare function now(): string;

/**
 * sprawdza czy wartośc jest null, jeśli tak to zwraca valueIfNull
 * @param value wartość do sprawdzenia
 * @param valueIfNull co ma zwracać gdy value === null
 */
declare function nullDefault(value: any, valueIfNull: any): any;

/**
 * dodaje widoące zera do liczby
 * @param value liczba
 * @param minLength minimalna, wynikowa długośc tekstu, domyslnie 2
 */
declare function padNumber(value: number, minLength?: number): string;

/**
 * dzisiejsza data w formacie yyyy-MM-dd
 */
declare function today(): string;

/**
 * sumuje wartości w tablicy
 * @param array tablica do sumowania
 * @param prop pole w wierszu podlegające sumowaniu, można pominąć
 */
declare function sum<T = any>(array: T[], prop?: keyof T | string | ((x: T, index: number) => any)): any;
/**
 * średnia wartośc z tablicy
 * @param array tablica do sumowania
 * @param prop pole w wierszu podlegające sumowaniu, można pominąć
 */
declare function avg<T = any>(array: T[], prop?: keyof T | ((x: any, index: number) => any)): number;
/**
 * unikalne wartości z tablicy
 * @param array tablica do sumowania
 * @param prop zwracane pole z wiersza tablicy
 */
declare function distinct(array: any[], prop?: string | ((x: any, index: number) => any)): any[];
/**
 * unikalne wiersze z tablicy
 * @param array tablica do sumowania
 * @param prop pole do określenia unikalności wiersza
 */
declare function distinctItem(array: any[], prop?: string | ((x: any, index: number) => any)): any[];
/**
 * zwraca maksymalną wartość
 * @param values tablica wartości
 * @param prop sprawdzane property
 */
declare function max(array: any[], prop?: string | ((x: any, index: number) => any)): any;
/**
 * zwraca minimalną wartość
 * @param values tablica wartości
 * @param prop sprawdzane property
 */
declare function min(array: any[], prop?: string | ((x: any, index: number) => any)): any;

/**
 * Zamiana liczny na słownie
 *
 * @export
 * @param {number} value liczba do zamiany na słownie
 * @returns {string} liczba słownie
 */
declare function toWords(value: number): string;

/**
 * zmiana liczy na zapis rzymski, wielkimi literami
 * 1-I, 2-II .... 10-X ...
 *
 * @export
 * @param {number} value liczba
 * @returns {string} liczba w zapisie rzymskim
 */
declare function bigRomanValue(value: number): string;
/**
 * zmiana liczy na zapis rzymski, małymi literami
 * 1-i, 2-ii .... 10-x ...
 *
 * @export
 * @param {number} value liczba
 * @returns {string} liczba w zapisie rzymskim
 */
declare function smallRomanValue(value: number): string;

/**
 * Zamiana kwoty na słownie ze słowem złoty/ch
 * @param value kwota do zamiany
 * @param currency co wstawić jako walutę, domyslnie automatycznie dopasowuje odmianę `złoty`
 * @param forceShowgr czy wymusić grosze w przypadku gdy liczba groszy jest równa 0
 */
declare function toWordsMoney(value: number, currency?: string, forceShowgr?: boolean): string;

type Replacer = (substring: string, ...args: any[]) => string;
type ReplaceAll = (str: string, find: string, replace: string | Replacer) => string;
/**
 * Funkcja replaceAll zamianiająca wszystkie wystąpienia tekstu.
 * @param str
 * @param find
 * @param replace
 * @returns
 */
declare let replaceAll: ReplaceAll;

/**
 * Synchronizuje tablice, usuwając elementy, które nie istnieją w sourceValues i dodając nowe elementy
 * @param destValues docelowa tablica
 * @param sourceValues źródłowa tablica
 * @param findFunc funkcja, która sprawdza czy elementy są takie same (domyslnie porównuje pola Guid)
 * @param mapFunc funkcja, która mapuje elementy z sourceValues na destValues (domyslnie kopiowanie obiektu)
 * @returns true jeśli tablica została zmieniona
 */
declare function syncArray<DestinationType, SourceType>(destValues: DestinationType[], sourceValues: SourceType[], findFunc?: (destItem: Partial<DestinationType>, sourceItem: SourceType) => boolean, mapFunc?: (sourceItem: SourceType) => Partial<DestinationType>): boolean;

declare function translate(key: string): string;
declare const lang: ILang;

declare const schemaMethods_avg: typeof avg;
declare const schemaMethods_bigRomanValue: typeof bigRomanValue;
declare const schemaMethods_capitalize: typeof capitalize;
declare const schemaMethods_check: typeof check;
declare const schemaMethods_dateAdd: typeof dateAdd;
declare const schemaMethods_dateDiff: typeof dateDiff;
declare const schemaMethods_dateFromPesel: typeof dateFromPesel;
declare const schemaMethods_dateHoliday: typeof dateHoliday;
declare const schemaMethods_dateParse: typeof dateParse;
declare const schemaMethods_datePart: typeof datePart;
declare const schemaMethods_dateSet: typeof dateSet;
declare const schemaMethods_deepCopy: typeof deepCopy;
declare const schemaMethods_defaultLang: typeof defaultLang;
declare const schemaMethods_displayDate: typeof displayDate;
declare const schemaMethods_distinct: typeof distinct;
declare const schemaMethods_distinctItem: typeof distinctItem;
declare const schemaMethods_fdate: typeof fdate;
declare const schemaMethods_fdatetime: typeof fdatetime;
declare const schemaMethods_fmoney: typeof fmoney;
declare const schemaMethods_fmoneySpace: typeof fmoneySpace;
declare const schemaMethods_fnumber: typeof fnumber;
declare const schemaMethods_fromDisplayDate: typeof fromDisplayDate;
declare const schemaMethods_ftime: typeof ftime;
declare const schemaMethods_generateGuid: typeof generateGuid;
declare const schemaMethods_generateShortGuid: typeof generateShortGuid;
declare const schemaMethods_includesAll: typeof includesAll;
declare const schemaMethods_lang: typeof lang;
declare const schemaMethods_listMonths: typeof listMonths;
declare const schemaMethods_listNumberFormat: typeof listNumberFormat;
declare const schemaMethods_listYears: typeof listYears;
declare const schemaMethods_max: typeof max;
declare const schemaMethods_min: typeof min;
declare const schemaMethods_mround: typeof mround;
declare const schemaMethods_nextListNumber: typeof nextListNumber;
declare const schemaMethods_now: typeof now;
declare const schemaMethods_nullDefault: typeof nullDefault;
declare const schemaMethods_padNumber: typeof padNumber;
declare const schemaMethods_patterns: typeof patterns;
declare const schemaMethods_percent: typeof percent;
declare const schemaMethods_replaceAll: typeof replaceAll;
declare const schemaMethods_smallRomanValue: typeof smallRomanValue;
declare const schemaMethods_sum: typeof sum;
declare const schemaMethods_syncArray: typeof syncArray;
declare const schemaMethods_toWords: typeof toWords;
declare const schemaMethods_toWordsMoney: typeof toWordsMoney;
declare const schemaMethods_today: typeof today;
declare const schemaMethods_translate: typeof translate;
declare const schemaMethods_trim: typeof trim;
declare namespace schemaMethods {
  export { schemaMethods_avg as avg, schemaMethods_bigRomanValue as bigRomanValue, schemaMethods_capitalize as capitalize, schemaMethods_check as check, schemaMethods_dateAdd as dateAdd, schemaMethods_dateDiff as dateDiff, schemaMethods_dateFromPesel as dateFromPesel, schemaMethods_dateHoliday as dateHoliday, schemaMethods_dateParse as dateParse, schemaMethods_datePart as datePart, schemaMethods_dateSet as dateSet, schemaMethods_deepCopy as deepCopy, schemaMethods_defaultLang as defaultLang, schemaMethods_displayDate as displayDate, schemaMethods_distinct as distinct, schemaMethods_distinctItem as distinctItem, schemaMethods_fdate as fdate, schemaMethods_fdatetime as fdatetime, schemaMethods_fmoney as fmoney, schemaMethods_fmoneySpace as fmoneySpace, schemaMethods_fnumber as fnumber, schemaMethods_fromDisplayDate as fromDisplayDate, schemaMethods_ftime as ftime, schemaMethods_generateGuid as generateGuid, schemaMethods_generateShortGuid as generateShortGuid, schemaMethods_includesAll as includesAll, schemaMethods_lang as lang, schemaMethods_listMonths as listMonths, schemaMethods_listNumberFormat as listNumberFormat, schemaMethods_listYears as listYears, schemaMethods_max as max, schemaMethods_min as min, schemaMethods_mround as mround, schemaMethods_nextListNumber as nextListNumber, schemaMethods_now as now, schemaMethods_nullDefault as nullDefault, schemaMethods_padNumber as padNumber, schemaMethods_patterns as patterns, schemaMethods_percent as percent, schemaMethods_replaceAll as replaceAll, schemaMethods_smallRomanValue as smallRomanValue, schemaMethods_sum as sum, schemaMethods_syncArray as syncArray, schemaMethods_toWords as toWords, schemaMethods_toWordsMoney as toWordsMoney, schemaMethods_today as today, schemaMethods_translate as translate, schemaMethods_trim as trim };
}

export { $methods, BaseSchemaClass, type CheckFormatType, type CreatePatternOptions, type DeepPartial, type EnumType, type FromSchema, type FromSchemaProperty, type FromSchemaPropertyArray, type FromSchemaPropertyObject, type FromSchemaPropertySimple, type FromSchemaSimple, type FromSchemaSimpleNonComputed, type IArrayItemExt, type II18N, type ILang, type IOptions, type ISchemaMethods, type IValidationMessages, type IWrapOptions, type IWrappedProperty, type IWrappedPropertyArray, type IWrappedPropertyObject, type IWrappedPropertySchema, type IWrapperPropertyArrayItem, JProp, type JSONSchema, type JSONSchemaFieldFormat, type JSONSchemaFieldType, type JSONSchemaSimple, JSchema, type PartialFromSchema, type PartialFromSchemaSimple, SchemaAggregate, SchemaClass, SchemaFormat, SchemaGuid, SchemaInteger, type SchemaInterface, SchemaMoney, SchemaOptions, type SchemaOptionsType, type SchemaPropType, type SchemaPropTypeArray, SchemaRequired, SchemaString, SchemaValidation, WrappedPropertyCtor, bigRomanValue, capitalize, checkFormat, classToSchema, clearData, compileFunctions, createLang, createPasswordPattern, dateAdd, dateDiff, dateFromPesel, dateHoliday, datePart, deepCopy, JSchema as default, defaultLang, defaultOptions, defineMethods, defineSchema, defineSchemaSimple, fixAndMergeSchema, fixData, fixDateFormat as fixFormat, fixMinifiedSchema, fixSchema, fixSchemaSimple, flatPropsList, fmoney, fmoneySpace, gdprData, generateGuid, generateShortGuid, getWrappedProperties, includesAll, isFunction, isObject, isWrappedProperty, listMonths, listYears, mergeOptions, mergeSchema, minifySchema, mround, nullDefault, padNumber, patterns, percent, polyfills, predefineSchema, predefineSchemaSimple, prefixSchema, prefixSchemaSimple, schemaDirective, schemaMethods, schemaMixin, schemaToJsText, setData, smallRomanValue, syncArray, toWords, toWordsMoney, today, traverseWrappedProperties, traverseWrappedPropertiesDistinct, usePagination, validate, validateTree, wrapSchema, wrapSchemaClass, wrapSchemaSimple };
