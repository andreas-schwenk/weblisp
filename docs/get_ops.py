
# extract list of implemented operators

f = open('src/weblisp.js')
lines = f.readlines()
f.close()

ops = []

state = 0
for line in lines:
    line = line.split('//')[0]
    line = line.strip()
    if 'eval(sexpr)' in line:
        state = 1
    elif 'default:' in line:
        state = 2
    elif state == 1:
        if 'case' in line and '_PROG' not in line:
            op = line.replace('case "', '').replace('":', '')
            op = op.replace('<', '&lt;').replace('>', '&gt;')
            ops.append(op)

ops = sorted(ops)

output = ''
for op in ops:
    if len(output) > 0:
        output += ', '
    output += '<code>' + op + '</code>'

print(output)
