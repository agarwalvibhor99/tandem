"""Disposable local PostgreSQL only; applies no migrations and cleans up its own fixtures."""
import concurrent.futures
import subprocess
import threading
import uuid

PSQL = ['/Library/PostgreSQL/16/bin/psql', '-h', '/private/tmp/tandem-auth-pg', '-p', '55439', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq']
users = [str(uuid.uuid4()) for _ in range(4)]

def sql(statement, check=True):
    result = subprocess.run(PSQL, input=statement, text=True, capture_output=True)
    if check and result.returncode:
        raise AssertionError(result.stderr)
    return result

def as_user(user, statement):
    return f"begin; set local role authenticated; set local request.jwt.claim.sub='{user}'; {statement}; commit;"

def race(statements):
    barrier = threading.Barrier(len(statements))
    def run(statement):
        barrier.wait()
        return sql(statement, check=False)
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(statements)) as pool:
        return list(pool.map(run, statements))

try:
    for i, user in enumerate(users):
        sql(f"insert into auth.users(id,email,raw_user_meta_data) values('{user}', 'race-{user}@example.com', '{{\"name\":\"Race member {i}\"}}');")
    space = sql(as_user(users[0], "select public.create_couple('Concurrency space')")).stdout.strip()
    code = sql(as_user(users[0], 'select invite_code from public.generate_couple_invite()')).stdout.strip()
    results = race([as_user(user, f"select public.accept_couple_invite('{code}')") for user in users[1:3]])
    assert sum(r.returncode == 0 for r in results) == 1, [r.stderr for r in results]
    assert any('INVITE_USED' in r.stderr for r in results)
    assert sql(f"select count(*) from public.couple_memberships where couple_id='{space}'").stdout.strip() == '2'
    results = race([as_user(users[3], "select public.create_couple('One space only')") for _ in range(2)])
    assert sum(r.returncode == 0 for r in results) == 1, [r.stderr for r in results]
    assert any('ALREADY_CONNECTED' in r.stderr for r in results)
    assert sql(f"select count(*) from public.couples where created_by='{users[3]}'").stdout.strip() == '1'
    print('PASS: simultaneous joins claim one remaining place; simultaneous creates produce one space.')
finally:
    identifiers = ','.join(f"'{user}'" for user in users)
    sql(f'delete from public.couples where created_by in ({identifiers}); delete from auth.users where id in ({identifiers});')
