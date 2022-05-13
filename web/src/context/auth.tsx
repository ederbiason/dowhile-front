import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type AuthResponse = {
    token: string, 
    user: {
        id: string;
        avatar_url: string;
        name: string;
        login: string;
    }
}

type User = {
    id: string;
    name: string;
    login: string;
    avatar_url: string;
}

type AuthContextData = {
    user: User | null;
    signInUrl: string;
    signOut: () => void;
}

export const AuthContext = createContext({} as AuthContextData);

type AuthProvider = {
    children: ReactNode;
}

export function AuthProvider(props: AuthProvider) {
    const [user, setUser] = useState<User | null>(null)

    const signInUrl = `https://github.com/login/oauth/authorize?scop=user&client_id=dd70a54ee5923543ca02`

    async function signIn(githubCode: string) {
        const response = await api.post<AuthResponse>('authenticate', {
            code: githubCode,
        })

        const { token, user } = response.data

        // armazenando token no navegador
        localStorage.setItem('@dowhile:token', token)

        api.defaults.headers.common.authorization = `Bearer ${token}`

        setUser(user)
    }

    function signOut() {
        setUser(null)
        localStorage.removeItem('@dowhile:token')
    }

    useEffect(() =>{
        const token = localStorage.getItem('@dowhile:token')

        if (token) {
            // para que toda requisição que parta daqui para frente, ela vá junto com o token no cabeçalho
            api.defaults.headers.common.authorization = `Bearer ${token}`

            api.get<User>('profile').then(response => {
                setUser(response.data)
            })
        }
    }, [])

    useEffect(() => {
        const url = window.location.href;
        const hasGithubCode = url.includes("?code=")

        if (hasGithubCode) {
            const [urlWithoutCode, githubCode] = url.split('?code=')

            // limpar o code da url
            window.history.pushState({}, '', urlWithoutCode)

            signIn(githubCode);
        }
    }, [])

    return (
        // todos os componentes que precisar de autenticação, vai vir daqui
        <AuthContext.Provider value={{ signInUrl, user, signOut }}>
            {props.children}
        </AuthContext.Provider>
    )
}

/* children é o que incluimos dentro do componente
   nesse caso todos os componentes vao ter acesso
*/