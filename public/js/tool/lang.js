
class L {
    static _LOAD_ERROR = 'Language table is not defined. There may have been a communication problem.'
    static _RENDER_FAILED = 'Template string not found.'
    static MD_ELEMENT_TYPE = {
        '%%' : 'mark',
        '__' : 'i',
        '****' : 'strong',
        '____' : 'u',
        '~~~~' : 's',
        '++' : 'sup',
        '--' : 'sub',
        '[]' : 'div'
    }
    static useClientData(data){
        console.log(L._info('trying to use client language object instead of server language object.'))
        if(typeof data == 'object'){
            LANG = data;
            console.log(L._info('setup finished.'))
        }
        else console.log(L._error(`Invalid type "${typeof data}".`))

    }
    static _error(text){
        return `Lang#Error : ${text}`
    }
    static _info(text){
        return `Lang#Info : ${text}`
    }
    static markdown(text, syntaxArray){
        let 
            mdMatch = text.match(new RegExp(`\\${syntaxArray[0].split('').join('\\')}(.*)\\${syntaxArray[1].split('').join('\\')}`, 'g')),
            tag = L.MD_ELEMENT_TYPE[syntaxArray.join('')]

        if(mdMatch) {
            mdMatch.forEach(ex => {
                let mdText = ex.replace(syntaxArray[0], '').replace(syntaxArray[1], '')
                text = text.replace(ex, `<${tag}${tag == 'div' ? ' class="inquiry"' : ''}>${mdText}</${tag}>`)
            })
            return text;
        }
        else return text;

    }
    static markdownALL(){}
    static render(keyExpression, substituteObject){
        console.log(LANG)
        if(!LANG) return L._error(L._LOAD_ERROR);

        let keys = keyExpression.split('.')
        let value = LANG

        for(const k of keys){
            if(!value.hasOwnProperty(k)) break;
            value = value[k]
        }
        if(typeof value == "object") return L._error(L._RENDER_FAILED);
    

        for(const k in substituteObject){
            let iconExpression = value.match(/\{#\S+\|\S+\}/)

            value = L.markdown(value, ['**', '**'])
            value = L.markdown(value, ['__', '__'])
            value = L.markdown(value, ['~~', '~~'])
            value = L.markdown(value, ['+', '+'])
            value = L.markdown(value, ['-', '-'])
            value = L.markdown(value, ['[', ']'])
            value = L.markdown(value, ['%', '%'])
            value = L.markdown(value, ['_', '_'])

            if(iconExpression) iconExpression.forEach(ex => {
                let icon = ex.split('|')[0].replace('{#','')
                value = value.replace(ex, `<i class="${LANG.icons[icon]}"></i>${substituteObject[k]}`)
            })

            value = value.replace(`{${k}}`, substituteObject[k])
        }

        return value;
    }
}
